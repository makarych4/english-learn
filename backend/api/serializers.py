#from .models import User
from django.contrib.auth.models import User
from rest_framework import serializers

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
            raise serializers.ValidationError("A user with that email already exists.")
        return value
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user