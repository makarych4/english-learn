import axios from "axios"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(
    (config) => {
        if (config.url.includes('/public/')) {
            return config;
        }
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => {
        // Если ответ успешный (статус 2xx), просто возвращаем его
        return response;
    },
    async (error) => {
        // Получаем исходный запрос, который вызвал ошибку
        const originalRequest = error.config;

        // Если ошибка - 401 Unauthorized и это еще не повторный запрос
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Помечаем запрос как повторный
            
            console.log("Access токен протух. Пытаемся обновить...");

            try {
                const refreshToken = localStorage.getItem(REFRESH_TOKEN);
                if (!refreshToken) {
                    // Если нет refresh токена, сразу выкидываем на логин
                    console.log("Refresh токен не найден. Перенаправление на /login.");
                    localStorage.clear();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // 1. Отправляем запрос на обновление токена
                const res = await api.post("/api/token/refresh/", {
                    refresh: refreshToken,
                });

                if (res.status === 200) {
                    // 2. Если успешно, сохраняем новый access токен
                    localStorage.setItem(ACCESS_TOKEN, res.data.access);
                    console.log("Access токен успешно обновлен.");

                    // 3. Обновляем заголовок в исходном (проваленном) запросе
                    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;

                    // 4. Повторяем исходный запрос с новым токеном
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Если запрос на обновление токена тоже провалился
                console.error("Не удалось обновить токен:", refreshError);
                localStorage.clear(); // Чистим хранилище
                window.location.href = '/login'; // Перенаправляем на логин
                return Promise.reject(refreshError);
            }
        }

        // Для всех остальных ошибок (не 401) просто возвращаем ошибку
        return Promise.reject(error);
    }
);

export default api