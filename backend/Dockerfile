# backend/Dockerfile

# 1. Базовый образ
FROM python:3.9-slim

# 2. Установка переменных окружения
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Установка зависимостей
WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt

# 4. Копирование кода проекта
COPY . /app/

# Команда для запуска НЕ НУЖНА здесь, мы укажем ее в docker-compose