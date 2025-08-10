from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Song, SongLyrics, Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import models

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["user_id"] = user.id
        return token

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["is_vip"]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", 'date_joined']
        extra_kwargs = {
            'date_joined': {'read_only': True},
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # Шаг 1: Создаем и сохраняем User, получаем объект с id
        user = User.objects.create_user(**validated_data) 
        # Шаг 2: Создаем и сохраняем Profile, используя user с уже существующим id
        Profile.objects.create(user=user)
        return user



    def validate_email(self, value):
        """ Проверка, что email уникален """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с такой почтой уже существует")
        return value
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artist", "user", "youtube_id", "is_published"]
        extra_kwargs = {
            "user": {"read_only": True},
            "youtube_id": {"allow_blank": True},
        }

class ArtistGroupSerializer(serializers.Serializer):
    artist = serializers.CharField()
    count = serializers.IntegerField()
    id = serializers.IntegerField(allow_null=True, required=False)


class TitleGroupSerializer(serializers.Serializer):
    title = serializers.CharField()
    artist = serializers.CharField()
    count = serializers.IntegerField()
    id = serializers.IntegerField(allow_null=True, required=False)

        
class SongLyricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongLyrics
        fields = ["id", "original_line", "translated_line", "line_number", "song"]
        extra_kwargs = {
            "original_line": {"allow_blank": True},
            "translated_line": {"allow_blank": True},
        }



class SongVersionListSerializer(serializers.ListSerializer):
    """
    Этот специальный сериализатор обрабатывает СПИСОК песен,
    чтобы пронумеровать их по порядку.
    """
    def to_representation(self, data):
        # Получаем итерируемый queryset
        iterable = data.all() if isinstance(data, models.Manager) else data
        
        ret = []
        # Проходим по списку с индексом (i = 0, 1, 2...)
        for i, item in enumerate(iterable):
            # Получаем стандартное представление объекта от дочернего сериализатора
            representation = self.child.to_representation(item)
            # Динамически изменяем поле 'title'
            representation['title'] = f"Версия {i + 1}"
            ret.append(representation)
        return ret

class SongVersionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для одной "версии" песни.
    Он использует кастомный ListSerializer для обработки списков.
    """
    # Новое поле, которое берет значение из оригинального 'title'
    original_title = serializers.CharField(source='title')

    class Meta:
        model = Song
        # Включаем новое поле и указываем порядок
        fields = [
            'id', 
            'title',             # Это поле будет перезаписано в ListSerializer
            'original_title', 
            'artist', 
            'youtube_id', 
            'is_published'
        ]
        # Главный трюк: указываем, какой класс использовать для списков
        list_serializer_class = SongVersionListSerializer

