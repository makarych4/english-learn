from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, SongSerializer, SongLyricsSerializer, ArtistGroupSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Song, SongLyrics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
# Поиск
import re
from collections import Counter
from .pagination import SongPagination, WordFrequencyPagination
from django.contrib.postgres.search import TrigramWordSimilarity
from django.db.models import F, Q, Count, OuterRef, Subquery, CharField
from django.db.models.functions import Lower

"""Создание песни и вывод песен пользователя"""
class SongListUserCreate(generics.ListCreateAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    # Песни созданные пользователем
    def get_queryset(self):
        user = self.request.user
        is_published = self.request.query_params.get("published", "") == "true"

        queryset = Song.objects.filter(user=user)

        if is_published:
            queryset = queryset.filter(is_published=True)
        else:
            queryset = queryset.filter(is_published=False)

        return queryset.order_by("id")
    
    # Создание песни
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)

"""Получение списка песен для общего просмотра"""
class SongListPublic(generics.ListAPIView):
    permission_classes = [AllowAny]
    pagination_class = SongPagination

    def get_serializer_class(self):
        artist_group = self.request.query_params.get("artist_group", "") == "true"
        selected_artist = self.request.query_params.get("selected_artist", "").strip().lower()
        if artist_group and not selected_artist:
            return ArtistGroupSerializer
        return SongSerializer
    
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


    def get_queryset(self):
        query = self.request.query_params.get("query", "").strip().lower()
        search_type = self.request.query_params.get("search_type", "")
        artist_group = self.request.query_params.get("artist_group", "") == "true"
        selected_artist = self.request.query_params.get("selected_artist", "").strip().lower()

        if search_type == "all_songs_search":
            queryset = Song.objects.filter(is_published=True).all().order_by('artist', 'title')

        elif search_type == "reduce_songs_search":
            """поиск по тексту песен с использованием триграммного сравнения слов"""
            # Динамически рассчитываем порог схожести (чем длиннее запрос, тем выше порог)
            trigram_threshold = self.get_similarity_threshold(
                query, 
                base=0,
                step=0.05,
                max_threshold=0.45
            )
            
            # Основной запрос к базе данных
            queryset = (
                Song.objects.filter(is_published=True)
                # Аннотируем схожесть полной фразы запроса с текстом песни
                .annotate(
                    phrase_similarity=TrigramWordSimilarity(query, 'search_text')
                )
                # Аннотируем схожесть первых трех слов запроса (для частичных совпадений)
                .annotate(
                    words_similarity=TrigramWordSimilarity(
                        ' '.join(query.split()), # Берем первые 3 слова запроса query.split()[:3]
                        'search_text'
                    )
                )
                # Фильтруем результаты по порогу схожести
                .filter(
                    Q(phrase_similarity__gt=trigram_threshold) | # Полное совпадение фразы
                    Q(words_similarity__gt=trigram_threshold)    # Частичное совпадение слов
                )
                # Создаем комбинированную метрику релевантности
                .annotate(
                    total_similarity=F('phrase_similarity') * 2 + F('words_similarity')
                )
                # Сортируем по убыванию релевантности
                .order_by(
                    '-total_similarity',  # Основная сортировка по комбинированной метрике
                    '-phrase_similarity'  # Дополнительная сортировка по точности фразы

                )
            )
            
        else:
            return Song.objects.none()
            
        if artist_group:
            if selected_artist:
                return queryset.filter(artist__iexact=selected_artist).order_by("title")
            else:
                # Получаем наиболее частое написание исполнителя
                most_common_artist = (
                    Song.objects
                    .filter(artist__iexact=OuterRef("artist"))
                    .values("artist")
                    .annotate(count=Count("id"))
                    .order_by("-count", "artist")
                    .values("artist")[:1]
                )

                return (
                    queryset
                    .annotate(artist_lower=Lower("artist"))
                    .values("artist_lower")
                    .annotate(
                        count=Count("id"),
                        artist=Subquery(most_common_artist, output_field=CharField())
                    )
                    .order_by("-count", "artist")
                )
            
        return queryset
    
class BaseSongRetrieve(generics.RetrieveUpdateAPIView):
    serializer_class = SongSerializer
    queryset = Song.objects.all()
    
"""Получение данных песни для редактирования"""
class SongRetrieve(BaseSongRetrieve):
    permission_classes = [IsAuthenticated]

"""Получение данных песни для общего просмотра"""
class SongRetrievePublic(BaseSongRetrieve):
    permission_classes = [AllowAny]
            
"""Удаление песни"""
class SongDelete(generics.DestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Song.objects.filter(user=user)            


class BaseSongLyricsList(generics.ListAPIView):
    serializer_class = SongLyricsSerializer

    def get_queryset(self):
        song_id = self.kwargs.get('song_id')
        return SongLyrics.objects.filter(song_id=song_id).order_by('line_number')
    
"""Получение текста песни для редактирования"""
class SongLyricsList(BaseSongLyricsList):
    permission_classes = [IsAuthenticated]

"""Получение текста песни для общего просмотра"""
class SongLyricsPublicList(BaseSongLyricsList):
    permission_classes = [AllowAny]

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
        return Response({
            "username": user.username,
            "is_superuser": user.is_superuser,
        })