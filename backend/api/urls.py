from django.urls import path
from . import views

urlpatterns = [
    path("songs/", views.SongListCreate.as_view(), name="song-list"),
    path("songs/delete/<int:pk>/", views.SongDelete.as_view(), name="delete-song"),
    path("songLyrics/", views.SongLyricsListCreate.as_view(), name="lyrics-list"),
    path("songLyrics/<int:song_id>/", views.SongLyricsListCreate.as_view(), name="lyrics-list-by-song"),
    path("songLyrics/detail/<int:pk>/", views.SongLyricsRUD.as_view(), name="lyrics-detail"),
    path("songLyrics/delete-all/<int:song_id>/", views.SongLyricsDeleteAll.as_view(), name="delete-all-lyrics"),
]