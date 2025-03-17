from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, SongSerializer, SongLyricsSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Song, SongLyrics
from rest_framework.response import Response
from rest_framework import status

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
        song_id = self.kwargs.get('song_id')
        return SongLyrics.objects.filter(song_id=song_id).order_by('line_number')
    
    # Создание строки к песне
    def perform_create(self, serializer):
        song_id = self.request.data.get('song')
        line_number = self.request.data.get('line_number')

        song = Song.objects.get(id=song_id)
        
        if serializer.is_valid():
            serializer.save(song=song, line_number=line_number)
        else:
            print(serializer.errors)

class SongLyricsDeleteAll(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        song_id = self.kwargs.get('song_id')
        SongLyrics.objects.filter(song_id=song_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SongLyricsRUD(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SongLyricsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return SongLyrics.objects.filter(song__user=user)
    
    def perform_update(self, serializer):
        if serializer.is_valid():
            serializer.save()
        else:
            print(serializer.errors)
    
    def perform_destroy(self, instance):
        instance.delete()

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]