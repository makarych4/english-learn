from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Song, SongLyrics
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["user_id"] = user.id
        return token

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", 'date_joined']
        extra_kwargs = {
            'date_joined': {'read_only': True},
            'password': {'write_only': True}
        }

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
        
class SongLyricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongLyrics
        fields = ["id", "original_line", "translated_line", "line_number", "song"]
        extra_kwargs = {
            "original_line": {"allow_blank": True},
            "translated_line": {"allow_blank": True},
        }

