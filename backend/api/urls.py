from django.urls import path
from .view.automatic_create_song import CreateSongWithGeniusView, TranslateSongLyricsView

from . import views

urlpatterns = [
    path("songs/", views.SongListUserCreate.as_view(), name="song-list-by-user"),
    path("songs/create-with-genius/<int:pk>/", CreateSongWithGeniusView.as_view(), name="create_song_with_genius"),
    path("songs/translate/<int:pk>/", TranslateSongLyricsView.as_view(), name="translate_line"),

    path("songs/public/", views.SongListPublic.as_view(), name="song-list-public"),
    path("songs/<int:pk>/", views.SongRetrieve.as_view(), name="song-detail"),
    path("songs/public/<int:pk>/", views.SongRetrievePublic.as_view(), name="song-detail-public"),
    path("songs/delete/<int:pk>/", views.SongDelete.as_view(), name="delete-song"),

    path("songLyrics/<int:song_id>/", views.SongLyricsList.as_view(), name="lyrics-list-by-song"),
    path("songLyrics/public/<int:song_id>/", views.SongLyricsPublicList.as_view(), name="lyrics-list-by-song-public"),
    path('songLyrics/update/<int:song_id>/', views.SongLyricsUpdate.as_view(), name='update-lyrics'),

    path("public/word-frequency/", views.WordFrequencyTopAPIView.as_view()),
    path("public/word-frequency/custom/", views.WordFrequencyCustomAPIView.as_view()),


    path('user/', views.CurrentUserView.as_view(), name='current-user'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),

    path('songs/clone/<int:original_song_id>/', views.CloneSongView.as_view(), name='clone-song'),
    path("song-ownership/<int:pk>/", views.SongOwnershipCheck.as_view(), name="song-ownership"),

    # Получить все аннотации для песни или создать новую
    path('songs/<int:song_id>/annotations/', views.AnnotationListCreateView.as_view(), name='song-annotations-list'),
    # Получить, обновить или удалить КОНКРЕТНУЮ аннотацию по ее ID
    path('annotations/<int:annotation_id>/', views.AnnotationDetailView.as_view(), name='annotation-detail'),
]