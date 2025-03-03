from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, SongSerializer, SongLyricsSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Song, SongLyrics

# Create your views here.
class SongListCreate(generics.ListCreateAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    # Песни созданные пользователем
    def get_queryset(self):
        user = self.request.user
        return Song.objects.filter(user=user)
    
    # Создание песни
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)
            
class SongDelete(generics.DestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Song.objects.filter(user=user)            

class SongLyricsListCreate(generics.ListCreateAPIView):
    serializer_class = SongLyricsSerializer
    permission_classes = [IsAuthenticated]

    # Строки к песне созданные пользователем
    def get_queryset(self):
        song = self.request.song
        return SongLyrics.objects.filter(song=song)
    
    # Создание строки к песне
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(song=self.request.song)
        else:
            print(serializer.errors)

class SongLyricsDelete(generics.DestroyAPIView):
    serializer_class = SongLyricsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        song = self.request.song
        return SongLyrics.objects.filter(song=song)

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
