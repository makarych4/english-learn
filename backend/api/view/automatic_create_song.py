from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Song, SongLyrics
from ..utils.lyrics_tools import get_genius
from ..utils.youtube_tools import get_youtube_music_id
#from ..utils.translate_tools import batch_translate_lines
from ..utils.translate_yandex import batch_translate_lines

"""Создание строк песни, названия, исполнителя с API Genius, и youtube_id"""
class CreateSongWithGeniusView(APIView):
    def post(self, request, pk=None):
        title_input = request.data.get("title")
        artist_input = request.data.get("artist")

        if not title_input or not artist_input:
            return Response({"error": "title and artist required"}, status=status.HTTP_400_BAD_REQUEST)

        genius = get_genius()

        try:
            genius_song = genius.search_song(title_input, artist_input)
        except Exception as e:
            print("Ошибка при получении текста с Genius:", e)
            return Response({"error": "Ошибка при обращении к Genius"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not genius_song or not genius_song.lyrics:
            return Response({"error": "Песня не найдена на Genius"}, status=status.HTTP_400_BAD_REQUEST)

        title = genius_song.title.strip()
        artist = genius_song.artist.strip()
        lyrics = genius_song.lyrics.strip()
        video_id = get_youtube_music_id(title, artist)

        if pk:
            try:
                song = Song.objects.get(id=pk, user=request.user)
                song.title = title
                song.artist = artist
                song.youtube_id = video_id
                song.save()
                SongLyrics.objects.filter(song=song).delete()
            except Song.DoesNotExist:
                return Response({"error": "Песня не найдена"}, status=status.HTTP_404_NOT_FOUND)
        else:
            song = Song.objects.create(
                title=title,
                artist=artist,
                youtube_id=video_id,
                user=request.user,
            )

        lines = [line.strip() for line in lyrics.split("\n") if line.strip()]
        SongLyrics.objects.bulk_create([
            SongLyrics(song=song, original_line=line, line_number=i)
            for i, line in enumerate(lines, start=1)
        ])

        return Response({
            "message": "Песня создана",
            "song_id": song.id,
            "title": title,
            "artist": artist,
            "youtube_id": video_id,
        }, status=status.HTTP_201_CREATED)

"""Создание построчного перевода к песне"""
class TranslateSongLyricsView(APIView):
    def post(self, request, pk):
        try:
            song = Song.objects.get(id=pk, user=request.user)
        except Song.DoesNotExist:
            return Response({"error": "Песня не найдена"}, status=status.HTTP_404_NOT_FOUND)

        lyrics = SongLyrics.objects.filter(song=song)

        # Собираем уникальные строки без перевода
        lines_to_translate = set()
        for line in lyrics:
            if not line.translated_line and line.original_line:
                lines_to_translate.add(line.original_line.strip())

        # Получаем переводы одним запросом
        translations = batch_translate_lines(list(lines_to_translate))

        # Применяем переводы
        for line in lyrics:
            original = line.original_line.strip()
            if not line.translated_line and original in translations:
                line.translated_line = translations[original]

        SongLyrics.objects.bulk_update(lyrics, ["translated_line"])

        return Response({"success": True})