import React, { useState, useEffect } from "react";
import { href, useParams } from "react-router-dom";
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
    const { songId } = useParams();

    const navigate = useNavigate();

    useEffect(() => {
        checkOwnership(songId)
        .then(setIsOwner)
        .catch(() => setIsOwner(false));
        getLyrics();
        getSongData();
    }, [songId]);

    const getLyrics = () => {
        setLoading(true);

        api
            .get(`/api/songLyrics/public/${songId}/`)
            .then((res) => res.data)
            .then((data) => {
                setLyrics(data);
                console.log(data);
            })
            .catch((err) => alert(err))
            .finally(() => setLoading(false));
    };

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

    const getSongData = () => {
        api
            .get(`/api/songs/public/${songId}/`)
            .then((res) => {
                setSongData(res.data);
            })
            .catch((err) => alert(err));
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.iconRow}>
                <div className={styles.iconContainer} onClick={handleEditOrClone}>
                    <img src={EditIcon} alt="Редактировать" />
                    <span className={styles.iconLabel}>Редактировать</span>
                </div>
            </div>
            <h2 className={styles.h2text}>Текст песни</h2>

            {loading ? (
                <LoadingIndicator />
            ) : (
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
            )}
            <YouTubePlayer videoId={songData.youtube_id} />
            <BottomNavigation active="search" />
            
        </div>
    );
}

export default SongLearn;
