from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Song, SongLyrics

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", 'date_joined'] #"email", 
        extra_kwargs = {
            'date_joined': {'read_only': True},
            'password': {'write_only': True}
        }

    # def validate_email(self, value):
    #     """ Проверка, что email уникален """
    #     if User.objects.filter(email=value).exists():
    #         raise serializers.ValidationError("A user with that email already exists.")
    #     return value
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artist", "user"]
        extra_kwargs = {
            "user": {"read_only": True}
        }