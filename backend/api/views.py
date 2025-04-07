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
from .pagination import SongPagination
from django.contrib.postgres.search import TrigramSimilarity, TrigramWordSimilarity
from django.db.models import F, Q, Value, FloatField, Count, Case, When, ExpressionWrapper, OuterRef, Subquery, CharField, Func
from django.db.models.functions import Greatest, Lower
from functools import reduce
from operator import add


from django.contrib.postgres.search import SearchQuery, SearchVector, SearchRank

class SongListUserCreate(generics.ListCreateAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    # Песни созданные пользователем
    def get_queryset(self):
        user = self.request.user
        return Song.objects.filter(user=user).order_by('id')
    
    # Создание песни
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)

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
        
        Логика:
        - Короткие запросы (пример: "over") имеют более низкий порог для большего количества результатов
        - Длинные запросы (пример: "over and over again") требуют более точного совпадения
        - Защита от слишком низких/высоких значений через max_threshold
        """
        return min(base + len(query) * step, max_threshold)


    def get_queryset(self):
        query = self.request.query_params.get("query", "").strip().lower()
        search_type = self.request.query_params.get("search_type", "")
        artist_group = self.request.query_params.get("artist_group", "") == "true"
        selected_artist = self.request.query_params.get("selected_artist", "").strip().lower()

        if not query:
            return Song.objects.none()

        if search_type == "lyrics_text_search":
            """
            Логика поиска по тексту песен с использованием триграммного сравнения слов.
            Основные принципы:
            1. Учитываем порядок слов в запросе
            2. Допускаем небольшие опечатки
            3. Приоритет у точных совпадений фразы
            4. Учитываем частичные совпадения отдельных слов
            """
            # Динамически рассчитываем порог схожести (чем длиннее запрос, тем выше порог)
            trigram_threshold = self.get_similarity_threshold(
                query, 
                base=0.4,  # Базовый порог для коротких запросов
                step=0.01, # Шаг увеличения на каждый символ
                max_threshold=0.5 # Максимальный порог
            )
            
            # Основной запрос к базе данных
            queryset = (
                Song.objects
                # Аннотируем схожесть полной фразы запроса с текстом песни
                .annotate(
                    phrase_similarity=TrigramWordSimilarity(query, 'lyrics_text')
                )
                # Аннотируем схожесть первых трех слов запроса (для частичных совпадений)
                .annotate(
                    words_similarity=TrigramWordSimilarity(
                        ' '.join(query.split()[:3]), # Берем первые 3 слова запроса
                        'lyrics_text'
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
        
        elif search_type == "title_artist_search":
            trigram_threshold = self.get_similarity_threshold(query, base=0.1)

            queryset = (
                Song.objects
                .annotate(similarity=TrigramSimilarity('title_artist', query))
                .filter(similarity__gt=trigram_threshold)
                .order_by('-similarity')
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
    
class BaseSongRetrieve(generics.RetrieveAPIView):
    serializer_class = SongSerializer

    queryset = Song.objects.all()
    
class SongRetrieve(BaseSongRetrieve):
    permission_classes = [IsAuthenticated]

class SongRetrievePublic(BaseSongRetrieve):
    permission_classes = [AllowAny]
            
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
    
class SongLyricsList(BaseSongLyricsList):
    permission_classes = [IsAuthenticated]

class SongLyricsPublicList(BaseSongLyricsList):
    permission_classes = [AllowAny]

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
            
            # Обновление title_artist
            clean_title = re.sub(r"\s+", " ", song.title.strip()).lower()
            clean_artist = re.sub(r"\s+", " ", song.artist.strip()).lower()

            song.title_artist = f"{clean_title} {clean_artist}"
            song.save(update_fields=["title_artist"])

            # Обновление lyrics_text
            original_lines = SongLyrics.objects.filter(song_id=song_id).order_by("line_number").values_list("original_line", flat=True)

            # Очистка пробелов и объединение строк
            cleaned_lines = [re.sub(r"\s+", " ", line.strip()) for line in original_lines]
            full_lyrics = " ".join(cleaned_lines).lower()

            # Сохранение в поле lyrics_text
            song.lyrics_text = full_lyrics
            song.save(update_fields=["lyrics_text"])

            return Response()
        
        except:
            return Response()
        
class ParseSongLyrics(APIView):
    def post(self, request, song_id):
        try:
            song = Song.objects.get(id=song_id)
            
            # Удаляем существующие строки
            SongLyrics.objects.filter(song=song).delete()
            
            # Парсим текст
            raw_text = request.data.get('raw_text', '')
            lines = self.parse_raw_text(raw_text)
            
            # Создаем новые записи
            created_lines = []
            for idx, line_text in enumerate(lines, start=1):
                line = SongLyrics(
                    song=song,
                    original_line=line_text,
                    line_number=idx
                )
                created_lines.append(line)
            
            SongLyrics.objects.bulk_create(created_lines)
            
            return Response()
            
        except Song.DoesNotExist:
            return Response()
        except:
            return Response()

    def parse_raw_text(self, text):
        lines = []
        for line in text.split('\n'):
            line = line.strip()
            # Пропускаем пустые строки и строки с тегами
            if line and not line.startswith('['):
                lines.append(line)
        return lines

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]