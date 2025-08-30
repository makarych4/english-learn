from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Song, SongLyrics, Profile, Annotation
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import models
from django.contrib.auth.password_validation import validate_password

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

    def validate_username(self, value):
        """
        Проверка, что имя пользователя (username) уникально.
        """
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует.")
        return value
    
    def create(self, validated_data):
        # Шаг 1: Создаем и сохраняем User, получаем объект с id
        user = User.objects.create_user(**validated_data) 
        # Шаг 2: Создаем и сохраняем Profile, используя user с уже существующим id
        Profile.objects.create(user=user)
        return user

class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artist", "user", "youtube_id", "is_published", "source_url"]
        extra_kwargs = {
            "user": {"read_only": True},
            "youtube_id": {"allow_blank": True},
            "source_url": {"allow_blank": True},
        }

class AnnotationSerializer(serializers.ModelSerializer):
    # Показываем ID строк, которые привязаны к этой аннотации
    lines = serializers.PrimaryKeyRelatedField(
        many=True, 
        read_only=False, # <-- Важно для PATCH
        allow_empty=True,
        queryset=SongLyrics.objects.all()
    )
    
    class Meta:
        model = Annotation
        fields = ['id', 'note', 'song', 'user', 'lines']
        read_only_fields = ['song', 'user']

class SongLyricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongLyrics
        fields = ["id", "original_line", "translated_line", "line_number", "song", 'annotation']
        extra_kwargs = {
            "original_line": {"allow_blank": True},
            "translated_line": {"allow_blank": True},
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
    is_published = serializers.BooleanField(allow_null=True, required=False)

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
    original_title = serializers.CharField(source='title')

    class Meta:
        model = Song
        fields = [
            'id', 
            'title',
            'original_title', 
            'artist', 
            'youtube_id', 
            'is_published'
        ]
        # указываем, какой класс использовать для списков
        list_serializer_class = SongVersionListSerializer

class ChangePasswordSerializer(serializers.Serializer):
    """
    Сериализатор для смены пароля.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password1 = serializers.CharField(required=True, write_only=True)
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        """
        Проверяет, что старый пароль, введенный пользователем, верен.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Старый пароль введен неверно.")
        return value

    def validate(self, data):
        """
        Проверяет, что два новых пароля совпадают.
        """
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "Пароли не совпадают."})
        
        # Проверяем новый пароль с помощью встроенных валидаторов Django
        try:
            validate_password(data['new_password1'], self.context['request'].user)
        except serializers.ValidationError as e:
            # Перехватываем и переформатируем ошибку валидации пароля
            raise serializers.ValidationError({"new_password1": list(e.get_codes())})
            
        return data

    def save(self, **kwargs):
        """
        Сохраняет новый пароль для пользователя.
        """
        password = self.validated_data['new_password1']
        user = self.context['request'].user
        user.set_password(password)
        user.save()
        return user
    
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username'] # Разрешаем менять только username