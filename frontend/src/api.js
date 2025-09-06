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

// Этот код выполняется ПОСЛЕ получения ответа от сервера
api.interceptors.response.use(
    (response) => {
        // Если ответ успешный (статус 2xx), мы ничего не делаем и просто возвращаем его
        return response;
    },
    async (error) => {
        // Получаем исходный запрос, который вызвал ошибку
        const originalRequest = error.config;

        // Проверяем, что ошибка - это 401 Unauthorized,
        // что мы еще не пытались повторить этот запрос,
        // и что это не был запрос на обновление токена (защита от цикла).
        if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== "/api/token/refresh/") {
            originalRequest._retry = true; // Помечаем запрос, чтобы не повторять его бесконечно

            console.log("Access токен протух. Пытаемся обновить...");

            try {
                const refreshToken = localStorage.getItem(REFRESH_TOKEN);
                if (!refreshToken) {
                    // Если refresh токена нет, сессия точно закончилась
                    console.log("Refresh токен не найден. Выход из системы.");
                    localStorage.clear();
                    window.location.href = '/login'; // Жесткий редирект на страницу входа
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

                    // 3. Обновляем заголовок в нашем экземпляре axios для всех последующих запросов
                    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                    // И обновляем заголовок в оригинальном запросе, который мы собираемся повторить
                    originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;

                    // 4. Повторяем исходный запрос с новым токеном
                    console.log("Повторяем оригинальный запрос:", originalRequest.url);
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Если запрос на обновление токена тоже провалился (например, refresh токен протух)
                console.error("Не удалось обновить токен:", refreshError);
                localStorage.clear(); // Полностью очищаем хранилище
                window.location.href = '/login'; // Перенаправляем на логин
                return Promise.reject(refreshError);
            }
        }

        // Для всех остальных ошибок (не 401, повторный 401, проваленный refresh) просто возвращаем ошибку дальше
        return Promise.reject(error);
    }
);

export default api;