from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.search import SearchVectorField

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    title_artist = models.TextField(blank=True, null=True)
    lyrics_text = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="uploaded_song")
    youtube_id = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.artist} - {self.title}"
    
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