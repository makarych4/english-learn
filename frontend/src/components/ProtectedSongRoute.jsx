import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function ProtectedSongRoute({ children }) {
    const { songId } = useParams();
    const [isOwner, setIsOwner] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        performAccessCheck();
    }, []);

    // Проверка наличия songId
    const validateSongId = () => {
        if (!songId) {
            throw new Error("ID песни не указан");
        }
    };

    // Получение и валидация токена
    const getValidToken = () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            throw new Error("Токен доступа отсутствует");
        }
        return token;
    };

    // Получение данных о песне
    const fetchSongData = async () => {
        const response = await api.get(`/api/songs/${songId}/`);
        return response.data;
    };

    // Извлечение user_id из токена
    const getUserIdFromToken = (token) => {
        const decoded = jwtDecode(token);
        return decoded.user_id;
    };

    // Основная проверка прав доступа
    const checkOwnership = async () => {
        validateSongId();
        const token = getValidToken();
        const song = await fetchSongData();
        const userId = getUserIdFromToken(token);
        return song.user === userId;
    };

    // Обработка процесса проверки
    const performAccessCheck = async () => {
        try {
            const result = await checkOwnership();
            setIsOwner(result);
        } catch (error) {
            console.error("Ошибка проверки прав:", error);
            setIsOwner(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return isOwner ? children : <Navigate to="/" />;
}

export default ProtectedSongRoute;