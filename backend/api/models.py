from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.search import SearchVector, SearchVectorField

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    title_artist = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="uploaded_song")
    youtube_id = models.CharField(max_length=20, blank=True, null=True)
    search_text = SearchVectorField(null=True, blank=True)

    def __str__(self):
        return f"{self.artist} - {self.title}"
    
    def update_search_text(self):
        """Обновляет поле search_text, объединяя заголовок, исполнителя и текст"""
        lyrics_text = " ".join(self.lyrics.values_list("original_line", flat=True))  # Объединяем все строки в один текст
        full_text = f"{self.title} {self.artist} {lyrics_text}"  # Всё в один текст
        self.search_text = full_text
        self.save(update_fields=["search_text"])


class SongLyrics(models.Model):
    original_line = models.TextField()
    translated_line = models.TextField()
    line_number = models.PositiveIntegerField()
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="lyrics")

    class Meta:
        ordering = ["line_number"]
        # constraints = [
        #     models.UniqueConstraint(fields=['song', 'line_number'], name='unique_line_per_song')
        # ]

    def __str__(self):
        return f"{self.song.title} (Line {self.line_number})"