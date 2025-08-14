import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import EditSongLyricsLine from "../components/EditSongLyricsLine";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import ensureAuth from "../utils/authUtils";
import styles from "../styles/EditSong.module.css"

import DeleteIcon from "../assets/trash.svg";
import PublishIcon from "../assets/publish.svg";


function EditSong() {
    const [lyrics, setLyrics] = useState([]);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [youtubeId, setYoutubeId] = useState("");
    const [isPublished, SetisPublished] = useState("");
    const [confirmDeleteLineId, setConfirmDeleteLineId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVip, setIsVip] = useState(false);
    const { songId } = useParams();

    const [youtubeUrl, setYoutubeUrl] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        getLyrics();
    }, [songId]);

    const getLyrics = async () => {
        setLoading(true);

        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        api.get('/api/user/')
            .then((res) => {
                setIsVip(res.data.is_vip);
            })
            .catch((err) => {
                console.log("Ошибка при получении пользователя", err);
            });
        
        api
            .get(`/api/songLyrics/${songId}/`)
            .then((res) => res.data)
            .then((data) => {
                setLyrics(data);
                console.log(data);
            })
            .catch((err) => alert(err));

        api
            .get(`/api/songs/${songId}/`)
            .then((res) => {
                setTitle(res.data.title);
                setArtist(res.data.artist);
                setYoutubeId(res.data.youtube_id);
                SetisPublished(res.data.is_published)

            })
            .catch((err) => alert(err))
            .finally(() => setLoading(false));
    };

    const handleParseYoutubeUrl = () => {
        if (!youtubeUrl) {
            alert("Пожалуйста, вставьте ссылку.");
            return;
        }

        let videoId = null;
        try {
            const url = new URL(youtubeUrl);
            // Для music.youtube.com и youtube.com ID находится в параметре 'v'
            if (url.hostname.includes("youtube.com")) {
                videoId = url.searchParams.get('v');
            }
        } catch (error) {
            // Если new URL() не сработал, попробуем регулярное выражение
            // для коротких ссылок или ссылок без протокола.
            console.warn("Не удалось распарсить URL стандартным способом, пробуем regex.");
        }

        // Запасной вариант с регулярным выражением для более сложных случаев
        if (!videoId) {
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const match = youtubeUrl.match(regex);
            if (match && match[1]) {
                videoId = match[1];
            }
        }

        if (videoId) {
            // Если ID найден, обновляем состояние и очищаем поле ввода URL
            setYoutubeId(videoId);
            setYoutubeUrl(""); // Очищаем инпут после успешного парсинга
            alert(`ID видео успешно установлен: ${videoId}`);
        } else {
            alert("Не удалось извлечь ID видео из ссылки. Проверьте ссылку и попробуйте снова.");
        }
    };

    const handleDeleteSong = async () => {
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        const confirmed = window.confirm("Вы собираетесь навсегда удалить песню целиком.");
        if (!confirmed) return;

        try {
            const res = await api.delete(`/api/songs/delete/${songId}/`);
            if (res.status === 204) {
                alert("Песня успешно удалена!");
                navigate("/");
            } else {
                alert("Не удалось удалить песню");
            }
        } catch (error) {
            alert("Ошибка при удалении");
            console.error(error);
        }
    };

    const handlePublishSong = async () => {
        if (!validateFields()) {
            return;
        }
        
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        const confirmed = window.confirm("Публикация песни сделает её видимой для других пользователей. Все внесённые изменения сохранятся");
        if (!confirmed) return;

        try {
            await api.patch(`/api/songs/${songId}/`, { is_published: true });
            alert("Песня успешно опубликована!");
            navigate("/");
        } catch (error) {
            alert("Ошибка при публикации песни");
            console.error(error);
        }
    };

    const handleAddLine = (index) => {
        const newLine = {
            original_line: "",
            translated_line: "",
            line_number: index + 1,
            song: songId,
        };
        const updatedLyrics = [...lyrics];
        // Вставка новой строки в массив
        updatedLyrics.splice(index, 0, newLine);
    
        // Пересчет в порядок 1, 2 , …, n
        updatedLyrics.forEach((line, idx) => {
            line.line_number = idx + 1;
        });
    
        setLyrics(updatedLyrics);
    };
    

    const handleChangeLine = (index, field, value) => {
        const updatedLyrics = [...lyrics];
        updatedLyrics[index][field] = value;
        setLyrics(updatedLyrics);
    };

    const handleDeleteLine = (index) => {
        const updatedLyrics = [...lyrics];
        updatedLyrics.splice(index, 1);

        // Пересчет в порядок 1, 2 , …, n
        updatedLyrics.forEach((line, idx) => {
            line.line_number = idx + 1;
        });

        setLyrics(updatedLyrics);
    };

    const requestDeleteLine = (index) => {
        setConfirmDeleteLineId(index);
    };
    
    const confirmDeleteLine = () => {
        handleDeleteLine(confirmDeleteLineId);
        setConfirmDeleteLineId(null);
    };
    
    const cancelDeleteLine = () => {
        setConfirmDeleteLineId(null);
    };


    const handleSave = async () => {

        if (!validateFields()) {
            return;
        }
        setLoading(true);

        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        try {
            await api.patch(`/api/songs/${songId}/`, {
                title,
                artist,
                youtube_id: youtubeId,
            });
    
            await api.post(`/api/songLyrics/update/${songId}/`, lyrics);

            if (!isPublished) alert("Изменения сохранены!");
            else alert("Изменения сохранены и видны другим пользователям!")
            // navigate("/");
        } catch (err) {
            alert("Ошибка. Данные не изменены.");
        } finally {
            setLoading(false);
        }
    };

    const handleFillLyrics = async () => {
        if (!validateFields()) {
            return;
        }

        setLoading(true);

        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        if (!title || !artist) {
            alert("Укажите название и исполнителя");
            return;
        }
        
        try {
            const res = await api.post(`/api/songs/create-with-genius/${songId}/`, { title, artist });
            
            if (res.data.song_id) {
                setTitle(res.data.title);
                setArtist(res.data.artist);
                setYoutubeId(res.data.youtube_id);
                getLyrics();
            }
        } catch (err) {
            alert("Не удалось получить текст песни");
            console.log(err);
        }
        finally {
            setLoading(false);
        }

    };

    const handleFillTranslations = async () => {
        if (!validateFields()) {
            return;
        }
        
        setLoading(true);

        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;
    
        try {
            await api.post(`/api/songLyrics/update/${songId}/`, lyrics);

            const res = await api.post(`/api/songs/translate/${songId}/`);

            if (res.data.success) {
                getLyrics();
            }

        } catch (err) {
            alert("Не удалось перевести текст песни");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    const validateFields = () => {
        // .trim() убирает пробелы по краям, чтобы пользователь
        // не мог сохранить поле, состоящее только из пробелов.
        if (!title.trim()) {
            alert("Пожалуйста, укажите название песни.");
            return false;
        }
        if (!artist.trim()) {
            alert("Пожалуйста, укажите исполнителя.");
            return false;
        }
        return true;
    };


    return (
        <div className={styles.pageContainer}>
            {loading ? (
                <LoadingIndicator />
            ) : (
                <>
                    <div className={styles.metaFields}>
                        <label className={styles.metaLabel}>
                            Название:
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={styles.metaInput}
                                
                            />
                        </label>
                        <label className={styles.metaLabel}>
                            Исполнитель:
                            <input
                                type="text"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                                className={styles.metaInput}
                                
                            />
                        </label>
                        <label className={styles.metaLabel}>
                            ID видео с ютуба:
                            <input
                                type="text"
                                value={youtubeId}
                                onChange={(e) => setYoutubeId(e.target.value)}
                                className={styles.metaInput}
                            />
                        </label>
                        <label className={styles.metaLabel}>
                            <input
                                type="text"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="Ссылка на песню на YouTube"
                                className={styles.metaInput}
                            />
                        </label>
                        <button onClick={handleParseYoutubeUrl} className={styles.addButton}>
                            Извлечь ID
                        </button>
                    </div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>

                    {isVip && (
                    <>
                    <div className={styles.buttonGroup}>
                        <button className={styles.addButton} onClick={handleFillLyrics}>
                            Заполнить текст с нуля
                        </button>
                        <div>&nbsp;</div>
                        <button className={styles.addButton} onClick={handleFillTranslations}>
                            Заполнить пустые строки перевода
                        </button>
                    </div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    </>
                    )}

                    <div className={styles.iconRow}>
                        <div className={styles.iconContainer} onClick={handleDeleteSong}>
                            <img src={DeleteIcon} alt="Удалить" />
                            <span className={styles.iconLabel}>Удалить</span>
                        </div>
                        {!isPublished && (<div className={styles.iconContainer} onClick={handlePublishSong}>
                            <img src={PublishIcon} alt="Опубликовать" />
                            <span className={styles.iconLabel}>Опубликовать</span>
                        </div>
                        )}
                    </div>

                    <h2 className={styles.h2text}>Редактирование текста песни</h2>
                    <button className={styles.addButton} onClick={() => handleAddLine(0)}>
                        Добавить строку
                    </button>
                    {lyrics.map((line, index) => (
                        <EditSongLyricsLine
                            line={line}
                            onChange={handleChangeLine}
                            onAddLine={handleAddLine}
                            onDeleteLine={requestDeleteLine}
                            index={index}
                            key={index}    
                        />
                    ))}

                    <button className={`${styles.saveButton} fixed-class`} onClick={handleSave}>Сохранить</button>
                    {confirmDeleteLineId !== null && (
                        <div className={styles.overlay}>
                            <div className={styles.confirmBox}>
                                <p>Удалить строку {lyrics[confirmDeleteLineId]?.line_number}?</p>
                                <div className={styles.confirmButtons}>
                                    <button onClick={confirmDeleteLine} className={styles.confirmButton}>Да</button>
                                    <button onClick={cancelDeleteLine} className={styles.cancelButton}>Отмена</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <BottomNavigation active="home" />
        </div>
    );
}

export default EditSong;