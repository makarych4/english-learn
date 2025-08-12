from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, SongSerializer, SongLyricsSerializer, ArtistGroupSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Song, SongLyrics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from rest_framework import status
# Поиск
import re
from collections import Counter
from .pagination import SongPagination, WordFrequencyPagination
from django.contrib.postgres.search import TrigramWordSimilarity, TrigramSimilarity
from django.db.models import F, Q, Count, OuterRef, Subquery, CharField, Min, Max
from django.db.models.functions import Lower



from .serializers import TitleGroupSerializer, SongVersionSerializer
from django.db.models.functions import Lower
from django.db.models import Count, Max, Subquery, OuterRef, CharField, Case, When, IntegerField, Value, BooleanField

class BaseSongListView:
    pagination_class = SongPagination

    def _is_default_flat_list_view(self):
        """
        Этот метод предназначен для переопределения в дочерних классах.
        По умолчанию он всегда возвращает False, чтобы не влиять
        на стандартное поведение.
        """
        return False

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SongSerializer

        artist_group = self.request.query_params.get("artist_group", "") == "true"
        selected_artist = self.request.query_params.get("selected_artist", "").strip().lower()
        selected_title = self.request.query_params.get("selected_title", "").strip().lower()
        
        if self._is_default_flat_list_view():
            # ...возвращаем сериализатор для "плоского" списка.
            return SongSerializer
        
        if selected_artist and selected_title:
            return SongVersionSerializer

        if artist_group:
            # Группировка по названию для выбранного исполнителя
            if selected_artist:
                return TitleGroupSerializer
            # Группировка по исполнителям
            else:
                return ArtistGroupSerializer
            
        return TitleGroupSerializer
    
    @staticmethod
    def get_similarity_threshold(query, base=0.15, step=0.01, max_threshold=0.5):
        """
        Рассчитывает динамический порог схожести в зависимости от длины запроса.
        
        Параметры:
        - query: поисковый запрос
        - base: базовый порог для пустого запроса
        - step: шаг увеличения порога на каждый символ
        - max_threshold: максимально допустимый порог
        """
        return min(base + len(query) * step, max_threshold)
    
    def get_base_queryset(self):
        """Абстрактный метод: возвращает queryset с базовым фильтром."""
        raise NotImplementedError


    def get_queryset(self):
        query = self.request.query_params.get("query", "").strip().lower()
        search_type = self.request.query_params.get("search_type", "")
        artist_group = self.request.query_params.get("artist_group", "") == "true"
        selected_artist = self.request.query_params.get("selected_artist", "").strip().lower()
        selected_title = self.request.query_params.get("selected_title", "").strip().lower()

        queryset = self.get_base_queryset()

        if self._is_default_flat_list_view():
            return queryset

        if search_type == "all_songs_search":
            queryset = queryset

        elif search_type == "reduce_songs_search":
            """
            Умный поиск с учетом веса полей:
            1. Максимальный приоритет у совпадений в названии (title).
            2. Средний приоритет у совпадений в исполнителе (artist).
            3. Базовый приоритет у совпадений в тексте песни (search_text).
            """
            if query:
                # Порог для точного совпадения (название, исполнитель)
                exact_match_threshold = 0.3
                # Порог для совпадения в тексте (может быть ниже)
                text_match_threshold = self.get_similarity_threshold(
                    query, base=0.2, step=0.03, max_threshold=0.45
                )

                queryset = (
                    queryset
                    # 1. Аннотируем схожесть для каждого ключевого поля
                    .annotate(
                        title_similarity=TrigramSimilarity('title', query),
                        artist_similarity=TrigramSimilarity('artist', query),
                        # Используем старую логику для текста
                        phrase_similarity=TrigramWordSimilarity(query, 'search_text'),
                        words_similarity=TrigramWordSimilarity(' '.join(query.split()), 'search_text')
                    )
                    # 2. Фильтруем. Песня должна совпасть ХОТЯ БЫ по одному критерию
                    .filter(
                        Q(title_similarity__gt=exact_match_threshold) |
                        Q(artist_similarity__gt=exact_match_threshold) |
                        Q(phrase_similarity__gt=text_match_threshold) |
                        Q(words_similarity__gt=text_match_threshold)
                    )
                    # 3. Создаем КОМБИНИРОВАННЫЙ БАЛЛ РЕЛЕВАНТНОСТИ с весами
                    .annotate(
                        final_relevance= (
                            F('title_similarity') * 10.0 +      # Огромный вес для названия
                            F('artist_similarity') * 5.0 +       # Средний вес для исполнителя
                            F('phrase_similarity') * 2.0 +       # Базовый вес для фразы в тексте
                            F('words_similarity') * 1.0          # Минимальный вес для слов в тексте
                        )
                    )
                    # 4. Сортируем по новому "умному" баллу
                    .order_by(
                        '-final_relevance'
                    )
                )
            
        else:
            return Song.objects.none()
            
        # Сценарий 4: Запрошены конкретные версии песни
        if selected_artist and selected_title:
            final_queryset = queryset.filter(
                artist__iexact=selected_artist, 
                title__iexact=selected_title
            )
            return final_queryset.order_by('id')
            # # Применяем сортировку по релевантности, если нужно
            # if search_type == "reduce_songs_search" and query:
            #     return final_queryset.order_by('-final_relevance')
            # else:
            #     return final_queryset.order_by('id') # Стандартная сортировка

        # Сценарии 1 и 2: Группировка
        if artist_group:
            # Сценарий 2: Группировка по названию для выбранного исполнителя
            if selected_artist:
                # Находим самое частое написание ИСПОЛНИТЕЛЯ для этой группы
                most_common_artist = (
                    Song.objects
                    .filter(artist__iexact=selected_artist)
                    .values("artist")
                    .annotate(c=Count("id"))
                    .order_by("-c", "artist")
                    .values("artist")[:1]
                )
                # Находим самое частое написание НАЗВАНИЯ для каждой подгруппы песен
                most_common_title = (
                    Song.objects
                    .filter(
                        artist__iexact=selected_artist,
                        title__iexact=OuterRef("title_lower")
                    )
                    .values("title")
                    .annotate(c=Count("id"))
                    .order_by("-c", "title")
                    .values("title")[:1]
                )

                grouped_query = (
                    queryset.filter(artist__iexact=selected_artist)
                    .annotate(title_lower=Lower("title"))
                    .values("title_lower")
                    .annotate(
                        count=Count("id"),
                        id=Case(
                            When(count=1, then=Max('id')),
                            default=None,
                            output_field=IntegerField()
                        ),
                        # is_published=Case(
                        #     When(count=1, then='is_published'),
                        #     default=None,
                        #     output_field=BooleanField()
                        # ),
                        artist=Subquery(most_common_artist, output_field=CharField()),
                        title=Subquery(most_common_title, output_field=CharField()),
                    )
                )
                if search_type == "reduce_songs_search" and query:
                    return grouped_query.annotate(
                        relevance=Max('final_relevance')
                    ).order_by('-relevance')
                else:
                    return grouped_query.order_by("title") # Стандартная сортировка
            
            # Сценарий 1: Группировка по исполнителям (существующая логика)
            else:
                # Эта часть кода остается без изменений
                most_common_artist = (
                    Song.objects
                    .filter(artist__iexact=OuterRef("artist_lower"))
                    .values("artist")
                    .annotate(count=Count("id"))
                    .order_by("-count", "artist")
                    .values("artist")[:1]
                )
                grouped_query = (
                    queryset
                    .annotate(artist_lower=Lower("artist"))
                    .values("artist_lower")
                    .annotate(
                        count=Count(Lower('title'), distinct=True), 
                        artist=Subquery(most_common_artist, output_field=CharField())
                    )
                )
                # Применяем сортировку по релевантности, если нужно
                if search_type == "reduce_songs_search" and query:
                    return grouped_query.annotate(
                        relevance=Max('final_relevance')
                    ).order_by('-relevance')
                else:
                    # Стандартная сортировка: сначала по кол-ву песен, потом по имени
                    return grouped_query.order_by("-count", "artist")
        
        # Подзапрос для получения самого частого написания ИСПОЛНИТЕЛЯ в группе
        most_common_artist_in_group = (
            Song.objects
            .filter(
                artist__iexact=OuterRef("artist_lower"), 
                title__iexact=OuterRef("title_lower")
            )
            .values("artist")
            .annotate(c=Count("id"))
            .order_by("-c", "artist")
            .values("artist")[:1]
        )

        # Подзапрос для получения самого частого написания НАЗВАНИЯ в группе
        most_common_title_in_group = (
            Song.objects
            .filter(
                artist__iexact=OuterRef("artist_lower"),
                title__iexact=OuterRef("title_lower")
            )
            .values("title")
            .annotate(c=Count("id"))
            .order_by("-c", "title")
            .values("title")[:1]
        )

        grouped_queryset = (
            queryset
            .annotate(artist_lower=Lower("artist"), title_lower=Lower("title"))
            .values("artist_lower", "title_lower")
            .annotate(
                count=Count("id"),
                id=Case(
                    When(count=1, then=Max('id')),
                    default=None,
                    output_field=IntegerField()
                ),
                # is_published=Case(
                #             When(count=1, then='is_published'),
                #             default=None,
                #             output_field=BooleanField()
                #         ),
                artist=Subquery(most_common_artist_in_group, output_field=CharField()),
                title=Subquery(most_common_title_in_group, output_field=CharField())
            )
        )

        # Теперь применяем СОРТИРОВКУ в зависимости от типа поиска
        if search_type == "reduce_songs_search" and query:
            # Если был умный поиск, агрегируем наш новый балл и сортируем по нему
            return grouped_queryset.annotate(
                relevance=Max('final_relevance')
            ).order_by('-relevance')
        else:
            # Во всех остальных случаях (включая пустой reduce_songs_search) сортируем по алфавиту
            return grouped_queryset

"""Создание песни и вывод песен пользователя"""
class SongListUserCreate(BaseSongListView, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_base_queryset(self):
        return Song.objects.filter(user=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)
    
    def _is_default_flat_list_view(self):
        """
        Проверяет, соответствует ли запрос условиям для отображения
        "плоского" списка песен пользователя.
        """
        # Получаем параметры запроса
        search_type = self.request.query_params.get("search_type", "all_songs_search")
        query = self.request.query_params.get("query", "").strip()
        artist_group = self.request.query_params.get("artist_group", "") == "true"
        selected_artist = self.request.query_params.get("selected_artist", "").strip()
        selected_title = self.request.query_params.get("selected_title", "").strip()

        return (
            search_type == "all_songs_search" and
            not query and
            not artist_group and
            not selected_artist and
            not selected_title
        )


"""Получение списка песен для общего просмотра"""
class SongListPublic(BaseSongListView, generics.ListAPIView):
    permission_classes = [AllowAny]
    
    def get_base_queryset(self):
        return Song.objects.filter(is_published=True).order_by('artist', 'title')
    
"""Получение данных песни для редактирования"""
class SongRetrieve(generics.RetrieveUpdateAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Возвращает ТОЛЬКО песни, принадлежащие текущему пользователю.
        """
        user = self.request.user
        return Song.objects.filter(user=user)

"""Получение данных песни для общего просмотра"""
class SongRetrievePublic(generics.RetrieveAPIView):
    serializer_class = SongSerializer
    permission_classes = [AllowAny]
    queryset = Song.objects.filter(is_published=True) # Защита от просмотра чужих черновиков
            
"""Удаление песни"""
class SongDelete(generics.DestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Song.objects.filter(user=user)            

"""Получение текста песни для общего просмотра"""
class SongLyricsPublicList(generics.ListAPIView):
    serializer_class = SongLyricsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        song_id = self.kwargs.get('song_id')
        return SongLyrics.objects.filter(song_id=song_id).order_by('line_number')
    
"""Получение текста песни для редактирования"""
class SongLyricsList(generics.ListAPIView):
    serializer_class = SongLyricsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        song_id = self.kwargs.get('song_id')
        return SongLyrics.objects.filter(song__user=user,song_id=song_id).order_by('line_number')
    

"""Обновление строк песни и search_text при изменении песни пользователем"""
class SongLyricsUpdate(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, song_id):
        
        try:
            # Получаем песню и проверяем права
            song = Song.objects.get(id=song_id)
            if song.user != request.user:
                raise PermissionDenied("Вы не можете редактировать эту песню.")
            
            # 1. Удалить старые строки
            SongLyrics.objects.filter(song_id=song_id).delete()
            
            # 2. Создать новые строки
            serializer = SongLyricsSerializer(
                data=request.data,
                many=True,
                context={'song_id': song_id})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            # 3. Обновление search_text
            clean_title = re.sub(r"\s+", " ", song.title.strip()).lower()
            clean_artist = re.sub(r"\s+", " ", song.artist.strip()).lower()

            original_lines = SongLyrics.objects.filter(song_id=song_id).order_by("line_number").values_list("original_line", flat=True)

            # Очистка пробелов и объединение строк c и названием и исполнителем
            cleaned_lines = [re.sub(r"\s+", " ", line.strip()) for line in original_lines]
            cleaned_lines = [clean_title, clean_artist] + cleaned_lines
            full_lyrics = " ".join(cleaned_lines).lower()

            # Сохранение в поле search_text
            song.search_text = full_lyrics
            song.save(update_fields=["search_text"])

            # 4. Обновление поля words для статистики частоты встречаемости слов
            self.update_words_field(song)

            return Response()
        
        except:
            return Response()
    
    def update_words_field(self, song):
        # Разбиваем search_text по словам, приводим к нижнему регистру
        words = re.findall(r"\b\w+\b", song.search_text.lower())
        song.words = words
        song.save(update_fields=["words"])

"""Регистрация нового пользователя"""
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

"""Создание топа встречаемости всех слов"""
class WordFrequencyTopAPIView(generics.ListAPIView):
    permission_classes = [AllowAny]
    pagination_class = WordFrequencyPagination

    def get_queryset(self):
        all_words = Song.objects.values_list("words", flat=True)
        counter = Counter()
        for word_list in all_words:
            if word_list:
                counter.update(word_list)
        top_items = counter.most_common()
        return [{"word": word, "frequency": count} for word, count in top_items]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        return self.get_paginated_response(page)


"""Создание топа встречаемости введенных пользователем слов"""
class WordFrequencyCustomAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        words = request.data.get("words", [])
        if not isinstance(words, list):
            return Response({"error": "Неверный формат слов"}, status=400)

        queryset = Song.objects.values_list("words", flat=True)
        counter = Counter()

        for word_list in queryset:
            if word_list:
                counter.update(word_list)

        result = [{"word": w, "frequency": counter.get(w, 0)} for w in words]
        return Response(result)
    

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        is_vip_status = user.profile.is_vip

        return Response({
            "username": user.username,
            "is_superuser": user.is_superuser,
            "is_vip": is_vip_status,
        })


from django.shortcuts import get_object_or_404

class CloneSongView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic # Используем транзакцию для гарантии целостности данных
    def post(self, request, original_song_id):
        # 1. Находим оригинальную песню. Если ее нет, будет ошибка 404.
        # Убеждаемся, что она опубликована, чтобы нельзя было копировать чужие черновики.
        original_song = get_object_or_404(Song, id=original_song_id, is_published=True)

        # 2. Создаем копию основной информации о песне
        new_song = Song.objects.create(
            title=f"Копия: {original_song.title}",
            artist=original_song.artist,
            youtube_id=original_song.youtube_id,
            user=request.user, # Присваиваем песню текущему пользователю
            is_published=False, # Новая копия всегда является черновиком
            # search_text и words будут пересчитаны при сохранении песни пользователем
        )

        # 3. Копируем строки текста (lyrics)
        original_lyrics = original_song.lyrics.all().order_by('line_number')
        new_lyrics_list = []

        for line in original_lyrics:
            new_lyrics_list.append(
                SongLyrics(
                    song=new_song,
                    original_line=line.original_line,
                    translated_line=line.translated_line,
                    line_number=line.line_number
                )
            )

        # Создаем все новые строки одним запросом для эффективности
        SongLyrics.objects.bulk_create(new_lyrics_list)
        
        # 4. Возвращаем данные о новой песне, чтобы фронтенд знал ее ID
        serializer = SongSerializer(new_song)
        return Response(serializer.data, status=201) # 201 Created
    
class SongOwnershipCheck(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            song = Song.objects.get(pk=pk)
        except Song.DoesNotExist:
            # Песня вообще не существует
            return Response({"is_owner": False}, status=status.HTTP_200_OK)

        # Проверка, что песня принадлежит текущему пользователю
        is_owner = (song.user == request.user)
        return Response({"is_owner": is_owner}, status=status.HTTP_200_OK)