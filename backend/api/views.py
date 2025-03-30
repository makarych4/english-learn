from django.shortcuts import render
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import generics
from .serializers import UserSerializer, SongSerializer, SongLyricsSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Song, SongLyrics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q

class SongListUserCreate(generics.ListCreateAPIView):
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

class SongListPublic(generics.ListAPIView):
    serializer_class = SongSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        query = self.request.query_params.get("query", "").strip()

        max_results = 20

        if not query:
            return Song.objects.none()  # Если запрос пустой, не возвращаем ничего

        queryset = Song.objects.filter(
            Q(title__icontains=query) | Q(artist__icontains=query)
        ).order_by("title")

        if queryset.count() > max_results:
            return queryset[:max_results]

        return queryset
    # queryset = Song.objects.all()

class SongRetrieve(generics.RetrieveAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    queryset = Song.objects.all()
    
    
            
class SongDelete(generics.DestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Song.objects.filter(user=user)            

class BaseSongLyricsList(generics.ListAPIView):
    serializer_class = SongLyricsSerializer

    def get_queryset(self):
        song_id = self.kwargs.get('song_id')
        return SongLyrics.objects.filter(song_id=song_id).order_by('line_number')
    
class SongLyricsList(BaseSongLyricsList):
    permission_classes = [IsAuthenticated]

class SongLyricsPublicList(BaseSongLyricsList):
    permission_classes = [AllowAny]

class SongLyricsUpdate(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, song_id):
        
        try:
            song = Song.objects.get(id=song_id)
            if song.user != request.user:
                raise PermissionDenied("Вы не можете редактировать эту песню.")
            
            # 1. Удалить старые строки
            SongLyrics.objects.filter(song_id=song_id).delete()
            
            # 2. Создать новые строки
            serializer = SongLyricsSerializer(
                data=request.data,
                many=True,
                context={'song_id': song_id})
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response()
        
        except:
            return Response()


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]