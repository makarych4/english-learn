import React, { useState, useEffect } from "react";
import { href, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom"; 
import { useNavigate } from "react-router-dom";
import api from "../api";
import SongLyricsLine from "../components/SongLyricsLine";
import YouTubePlayer from "../components/YouTubePlayer";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import { checkOwnership } from '../utils/authUtils';
import  ensureAuth  from '../utils/authUtils';
import styles from '../styles/SongLearn.module.css';

import EditIcon from "../assets/pencil.svg";

function SongLearn() {
    const [lyrics, setLyrics] = useState([]);
    const [songData, setSongData] = useState("")
    const [loading, setLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [youtubeError, setYoutubeError] = useState(false);
    const { songId } = useParams();

    const location = useLocation();

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setYoutubeError(false); 
            
            try {
                // 1. Сначала определяем, является ли пользователь владельцем
                const ownerStatus = await checkOwnership(songId);
                setIsOwner(ownerStatus);

                // 2. Формируем URL на основе полученного статуса
                const lyricsUrl = ownerStatus
                    ? `/api/songLyrics/${songId}/`
                    : `/api/songLyrics/public/${songId}/`;

                const songUrl = ownerStatus
                    ? `/api/songs/${songId}/`
                    : `/api/songs/public/${songId}/`;
                // 3. Выполняем запросы параллельно для скорости
                const [lyricsResponse, songResponse] = await Promise.all([
                    api.get(lyricsUrl),
                    api.get(songUrl)
                ]);

                // 4. Устанавливаем данные
                setLyrics(lyricsResponse.data);
                setSongData(songResponse.data);
                

            } catch (error) {
                // Обрабатываем ошибку, если любой из запросов не удался
                // (например, 404, если песни не существует ни там, ни там)
                console.error("Failed to fetch song data:", error);
                alert("Не удалось загрузить данные песни. Возможно, она не существует или у вас нет к ней доступа.");
                navigate("/"); // Перенаправляем на главную
            } finally {
                setLoading(false);
            }
        };

        fetchData(); // Вызываем асинхронную функцию
    }, [songId]); // Зависимость только от songId

    const handleEditOrClone = async () => {
        if (isOwner) {
            // --- ЛОГИКА ДЛЯ ВЛАДЕЛЬЦА ---
            // Пользователь должен быть авторизован. Если нет - перенаправляем.
            const isAuth = await ensureAuth(navigate);
            if (!isAuth) return; // ensureAuth уже сделал перенаправление

            // Если все в порядке, переходим на страницу редактирования
            navigate(`/edit-song/${songId}`);

        } else {
            const isAuth = await ensureAuth(null); 

            if (isAuth) {
                // Если пользователь авторизован, предлагаем ему скопировать песню
                const confirmClone = window.confirm(
                    "Создайте и отредактируйте копию текущей песни."
                );

                if (confirmClone) {
                    setLoading(true);
                    api.post(`/api/songs/clone/${songId}/`)
                        .then((res) => {
                            const newSongId = res.data.id;
                            alert("Копия песни успешно создана!");
                            navigate(`/edit-song/${newSongId}`);
                        })
                        .catch((err) => {
                            console.error("Ошибка при копировании песни:", err);
                            alert("Не удалось создать копию песни.");
                        })
                        .finally(() => setLoading(false));
                }
            } else {
                // Если пользователь НЕ авторизован, показываем специальное сообщение
                alert("Войдите, чтобы создать и отредактировать копию текущей песни");
            }
        }
    };

    // 3. Извлекаем 'from' из state. Если его нет, по умолчанию ставим 'search'.
    const activeTab = location.state?.from || 'search';

    return (
        <div className={styles.pageContainer}>
            {loading ? (
                <LoadingIndicator />
            ) : (
                <>
                    <div className={styles.iconRow}>
                        <div className={styles.iconContainer} onClick={handleEditOrClone}>
                            <img src={EditIcon} alt="Редактировать" />
                            <span className={styles.iconLabel}>Редактировать</span>
                        </div>
                    </div>
                    <div className={styles.songHint}>
                        <h1 className={styles.selectedTitle}>
                            {songData.title}
                        </h1>
                        <h2 className={styles.selectedArtist}>
                            {songData.artist}
                        </h2>
                    </div>

                    <div className={styles.container}>
                        {lyrics.map((line, index) => (
                            <div key={line.id}>
                                <SongLyricsLine
                                line={line}
                            />
                                {index < lyrics.length - 1 && <hr/>}
                            </div>
                            
                        ))}
                    </div>

                    {songData.youtube_id && !youtubeError && (<YouTubePlayer videoId={songData.youtube_id} />)}     
                </>
            )}
            <BottomNavigation active={activeTab} />
        </div>
    );
}

export default SongLearn;
