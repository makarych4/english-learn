from django.urls import path
from . import views

urlpatterns = [
    path("songs/", views.SongListUserCreate.as_view(), name="song-list-by-user"),
    path("songs/public/", views.SongListPublic.as_view(), name="song-list-public"),
    path("songs/<int:pk>/", views.SongRetrieve.as_view(), name="song-detail"),
    path("songs/public/<int:pk>/", views.SongRetrievePublic.as_view(), name="song-detail-public"),
    path("songs/delete/<int:pk>/", views.SongDelete.as_view(), name="delete-song"),

    path("songLyrics/<int:song_id>/", views.SongLyricsList.as_view(), name="lyrics-list-by-song"),
    path('songLyrics/<int:song_id>/parse-lyrics/', views.ParseSongLyrics.as_view(), name='parse-lyrics'),
    path("songLyrics/public/<int:song_id>/", views.SongLyricsPublicList.as_view(), name="lyrics-list-by-song-public"),
    path('songLyrics/update/<int:song_id>/', views.SongLyricsUpdate.as_view(), name='update-lyrics'),



]