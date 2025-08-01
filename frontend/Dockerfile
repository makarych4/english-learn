# FROM node:alpine AS build

# COPY package.json package.json
# RUN npm install
# COPY . .
# RUN npm run build

# FROM nginx:stable-alpine

# COPY --from=build /dist /usr/share/nginx/html
# COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 3000
# CMD [ "nginx", "-g", "daemon off;" ]
# frontend/Dockerfile

# --- ЭТАП 1: Сборка React приложения ---
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Копируем исходный код и собираем билд
COPY . .
RUN npm run build

# --- ЭТАП 2: Настройка Nginx ---
FROM nginx:stable-alpine

# Копируем собранные файлы из этапа "builder"
COPY --from=builder /app/build /usr/share/nginx/html

# Удаляем дефолтную конфигурацию Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем нашу конфигурацию (создадим ее на следующем шаге)
COPY nginx.conf /etc/nginx/conf.d

# Порт, который будет слушать Nginx
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]