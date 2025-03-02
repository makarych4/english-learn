from django.urls import path
from . import views

urlpatterns = [
    path("songs/", views.SongListCreate.as_view(), name="song-list"),
    path("songs/delete/<int:pk>/", views.SongDelete.as_view(), name="delete-song"),
]