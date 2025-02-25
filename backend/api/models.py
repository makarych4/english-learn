from django.db import models
from django.contrib.auth.models import User

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.artist} - {self.title}"


class SongLyrics(models.Model):
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="lyrics")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    original_line = models.TextField()
    translated_line = models.TextField()
    line_number = models.PositiveIntegerField()

    class Meta:
        ordering = ["line_number"]
        unique_together = ["song", "line_number"]

    def __str__(self):
        return f"{self.song.title} (Line {self.line_number})"