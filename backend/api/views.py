from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, SongSerializer, SongLyricsSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Song, SongLyrics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models.functions import Length, Replace, Coalesce
from django.db.models.expressions import ExpressionWrapper
from django.db.models import F, Value, IntegerField, Q
from django.db import transaction
from .pagination import SongPagination
from functools import reduce
import string

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
    serializer_class = SongSerializer
    permission_classes = [AllowAny]
    pagination_class = SongPagination

    def get_queryset(self):
        query = self.request.query_params.get("query", "").strip().lower()
        if not query:
            return Song.objects.none()

        query_words = [word for word in query.split() if word]  # Исключаем пустые слова

        if not query_words:
            return Song.objects.none()

        # Фильтр: хотя бы одно слово есть в title_artist
        filters = reduce(
            lambda q, word: q | Q(title_artist__icontains=word),
            query_words,
            Q()
        )

        annotations = {}
        for word in query_words:
            word_length = len(word)
            if word_length == 0:
                continue

            # Вычисляем количество вхождений слова
            replace_expr = Replace("title_artist", Value(word), Value(""))
            length_diff = Length("title_artist") - Length(replace_expr)
            
            # Количество вхождений = разница длин / длина слова
            match_count = length_diff / Value(word_length)
            
            # Сумма квадратов: количество_вхождений * (длина_слова^2)
            score_expr = match_count * Value(word_length ** 2)
            
            # Сохраняем с обработкой NULL
            annotations[f"match_{word}"] = Coalesce(
                ExpressionWrapper(score_expr, output_field=IntegerField()),
                Value(0)
            )

        queryset = Song.objects.filter(filters).annotate(**annotations)

        # Суммируем все баллы для каждого слова
        match_fields = [F(f"match_{word}") for word in query_words]
        match_score_expr = reduce(lambda a, b: a + b, match_fields, Value(0))

        return queryset.annotate(
            match_score=match_score_expr
        ).order_by("-match_score", "title", "artist")

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
            
            # Обновление поискового текста по названию и сполнителю
            song.title_artist = f"{song.title.lower()} {song.artist.lower()}"
            song.save(update_fields=["title_artist"])

            return Response()
        
        except:
            return Response()
        
    def update_search_text(self, song):
        """Обновляет поисковый текст песни на основе её метаданных и текста"""
        # Получаем все оригинальные строки текста
        lyrics_lines = [line.original_line for line in song.lyrics.all()]
        
        # Собираем полный текст
        full_text = ' '.join([
            #song.title,
            #song.artist,
            ' '.join(lyrics_lines)
        ])
        
        # Очищаем текст
        translator = str.maketrans('', '', string.punctuation)
        cleaned_text = full_text.translate(translator).lower()
        
        # Обновляем поле
        song.search_text = cleaned_text
        song.save()

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
