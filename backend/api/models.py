from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import transaction
import re

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    title_artist = models.TextField(blank=True, null=True)
    search_text = models.TextField(blank=True, null=True)
    words = ArrayField(models.TextField(), blank=True, default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="uploaded_song")
    youtube_id = models.CharField(max_length=20, blank=True, null=True)
    #is_approved = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    source_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"{self.artist} - {self.title}"
    
    @classmethod
    def update_all_words(cls, batch_size=1000):
        """
        Обновляет поле words для всех песен в базе
        """
        songs = cls.objects.all().only('id', 'search_text', 'words')
        updated_songs = []
        
        with transaction.atomic():
            for song in songs.iterator():
                # Токенизация текста
                words = re.findall(r"\b\w+\b", song.search_text.lower())
                song.words = words
                updated_songs.append(song)
                
                if len(updated_songs) >= batch_size:
                    cls.objects.bulk_update(updated_songs, ['words'])
                    updated_songs = []
            
            if updated_songs:
                cls.objects.bulk_update(updated_songs, ['words'])

class Annotation(models.Model):
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='annotations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="annotations")
    note = models.TextField()

class SongLyrics(models.Model):
    original_line = models.TextField()
    translated_line = models.TextField()
    line_number = models.PositiveIntegerField()
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="lyrics")
    annotation = models.ForeignKey(Annotation, on_delete=models.SET_NULL, related_name="lines", null=True, blank=True)

    class Meta:
        unique_together = ('song', 'line_number')
        ordering = ["line_number"]

    def __str__(self):
        return f"{self.song.title} (Line {self.line_number})"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_vip = models.BooleanField(default=False)