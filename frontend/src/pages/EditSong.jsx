import React, { useState, useEffect, useRef } from "react";
import { flushSync } from 'react-dom';
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { useQueryClient, useQuery } from '@tanstack/react-query';
import api from "../api";
import EditSongLyricsLine from "../components/EditSongLyricsLine";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import ensureAuth from "../utils/authUtils";
import useScrollTrigger from "../hooks/useScrollTrigger";
import styles from "../styles/EditSong.module.css"
import DeleteIcon from "../assets/trash.svg";
import PublishIcon from "../assets/publish.svg";
import LinesIcon from "../assets/lines.svg";
import SaveIcon from "../assets/save.svg";
import EyeIcon from "../assets/eye.svg";
import HighlighterIcon from "../assets/highlighter.svg";



function EditSong() {
    const { songId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const queryKey = ['editSong', songId];

    const fetchAndVerifySongData = async ({ signal }) => {
        // Проверка авторизации
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) {
            // Если не авторизован, выбрасываем ошибку, чтобы useQuery перешел в статус 'error'
            throw new Error("User not authenticated");
        }

        // Запускаем все запросы параллельно
        const [lyricsRes, songRes, annotationsRes, userRes, ownershipRes] = await Promise.all([
            api.get(`/api/songLyrics/${songId}/`, { signal }),
            api.get(`/api/songs/${songId}/`, { signal }),
            api.get(`/api/songs/${songId}/annotations/`, { signal }),
            api.get('/api/user/', { signal }),
            api.get(`/api/song-ownership/${songId}/`, { signal })
        ]);

        // ПРОВЕРКА ВЛАДЕНИЯ
        if (!ownershipRes.data.is_owner) {
            const error = new Error("User is not the owner of the song.");
            error.isOwnershipError = true;
            throw error;
        }

        // Если все проверки пройдены, возвращаем единый объект с данными
        return {
            lyrics: lyricsRes.data,
            song: songRes.data,
            annotations: annotationsRes.data,
            user: userRes.data,
        };
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: queryKey,
        queryFn: fetchAndVerifySongData,
        retry: false, // Отключаем повторные попытки при ошибке
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false, // Не перезапрашивать при фокусе на окне
    });

    const iconRowStickyRef = useScrollTrigger(styles.hasBorder, [isLoading]);

    const [lyrics, setLyrics] = useState(data?.lyrics || []);
    const [title, setTitle] = useState(data?.song?.title || "");
    const [artist, setArtist] = useState(data?.song?.artist || "");
    const [youtubeId, setYoutubeId] = useState(data?.song?.youtube_id || "");
    const [isPublished, SetisPublished] = useState(data?.song?.is_published || false);
    const [sourceUrl, setSourceUrl] = useState(data?.song?.source_url || "");

    const [isVip, setIsVip] = useState(data?.user?.is_vip || false);
    const [confirmDeleteLineId, setConfirmDeleteLineId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [isDirty, setIsDirty] = useState(false);

    // СОСТОЯНИЯ ДЛЯ АННОТАЦИЙ
    const [isAnnotationMode, setIsAnnotationMode] = useState(false);
    const [isAlreadyInAnnotationMode, setIsAlreadyInAnnotationMode] = useState(false);
    const [selectedLineIds, setSelectedLineIds] = useState([]);
    const [showAnnotationModal, setShowAnnotationModal] = useState(false);
    const [currentAnnotationNote, setCurrentAnnotationNote] = useState("");
    const [annotations, setAnnotations] = useState(data?.annotations || []);
    const [editingAnnotationId, setEditingAnnotationId] = useState(null);
    const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);
    const [isEditingAnnotationLines, setIsEditingAnnotationLines] = useState(false);

    const hasWarmedUpLearnCache = useRef(false);
    useEffect(() => {
        if (data) {
            setLyrics(data.lyrics);
            setTitle(data.song.title || "");
            setArtist(data.song.artist || "");
            setYoutubeId(data.song.youtube_id || "");
            SetisPublished(data.song.is_published || false);
            setSourceUrl(data.song.source_url || "");
            setAnnotations(data.annotations);
            setIsVip(data.user.is_vip);

            if (!hasWarmedUpLearnCache.current) {
                const songLearnQueryKey = ['songLearn', songId];
                
                queryClient.setQueryData(songLearnQueryKey, (oldData) => ({
                    ...(oldData || {}),
                    lyrics: data.lyrics,
                    song: data.song,
                    annotations: data.annotations,
                    isOwner: true
                }));

                hasWarmedUpLearnCache.current = true;
            }
        }
    }, [data, songId, queryClient]);

    if (isError) {
        // Кастомная обработка ошибки владения
        if (error.isOwnershipError) {
            alert("У вас нет прав для редактирования этой песни.");
            navigate("/");
            return null;
        }
        
        if (error.name !== 'CanceledError') {
            alert("Не удалось загрузить данные для редактирования.");
            navigate("/");
            return null;
        }
    }

    const blocker = useBlocker(isDirty);

    // обработка логики подтверждения при покидании страницы
    useEffect(() => {
        
        if (blocker && blocker.state === 'blocked') {
            if (window.confirm("У Вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?")) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    // стандартный показ сообщения браузера при покидании страницы
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isDirty]);

    // блокировка скролла при показе оверлея
    useEffect(() => {
        const isOverlayVisible = showAnnotationModal || confirmDeleteLineId !== null;

        if (isOverlayVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        // Функция очистки, если пользователь уйдет со страницы
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showAnnotationModal, confirmDeleteLineId]);

const handleOpenAnnotationToEdit = (annotationId) => {
    const annotation = annotations.find(anno => anno.id === annotationId);
    if (annotation) {
        if (!isEditingAnnotationLines) {
            setEditingAnnotationId(annotationId);
        }
        setCurrentAnnotationNote(annotation.note);
        setShowAnnotationModal(true);
    }
};

// Обновляет текст существующей аннотации
const handleUpdateAnnotation = async () => {
    if (!editingAnnotationId) return;
    if (!currentAnnotationNote.trim()) {
        alert("Текст аннотации не может быть пустым.");
        return;
    }

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    setIsSaving(true);
    try {
        const response = await api.patch(`/api/annotations/${editingAnnotationId}/`, { note: currentAnnotationNote });
        
        queryClient.setQueryData(queryKey, (oldData) => {
            
            return {
                ...oldData,
                annotations: response.data.annotations,
            };
        });

        queryClient.invalidateQueries({ queryKey: ['songLearn', songId] });
        
        setAnnotations(response.data.annotations);

        closeAnnotationModal();
        alert("Аннотация обновлена!");
    } catch (error) {
        alert("Не удалось обновить аннотацию.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
};

// Удаляет аннотацию
const handleDeleteAnnotation = async () => {
    if (!editingAnnotationId) return;

    if (!window.confirm("Вы уверены, что хотите удалить эту аннотацию?")) {
        return;
    }

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    setIsDeleting(true);
    try {
        const response = await api.delete(`/api/annotations/${editingAnnotationId}/`);

        queryClient.setQueryData(queryKey, (oldData) => {
            
            return {
                ...oldData,
                lyrics: response.data.lyrics,
                annotations: response.data.annotations,
            };
        });

        queryClient.setQueryData(['songLearn', songId], (oldData) => {
            
            return {
                ...oldData,
                lyrics: response.data.lyrics,
                annotations: response.data.annotations,
            };
        });

        setLyrics(response.data.lyrics);
        setAnnotations(response.data.annotations);

        closeAnnotationModal();
        alert("Аннотация удалена!");
    } catch (error) {
        alert("Не удалось удалить аннотацию.");
        console.error(error);
    } finally {
        setIsDeleting(false);
    }
};

// Вспомогательная функция для закрытия модального окна и сброса состояний
const closeAnnotationModal = () => {
    setShowAnnotationModal(false);
    setCurrentAnnotationNote("");
    if (!isEditingAnnotationLines) {
        setEditingAnnotationId(null);
    }
};

const toggleAnnotationMode = () => {
    if (isDirty) {
        alert("Пожалуйста, сохраните изменения в тексте песни, прежде чем работать с аннотациями.");
        return;
    }
    setIsAnnotationMode(!isAnnotationMode);
    setSelectedLineIds([]);
    setIsAlreadyInAnnotationMode(!isAlreadyInAnnotationMode)
};

// Обработчик выбора/снятия выбора строки
const handleLineSelect = (lineId) => {
    setSelectedLineIds(prev => 
        prev.includes(lineId)
            ? prev.filter(id => id !== lineId) // Снять выбор
            : [...prev, lineId] // Добавить в выбор
    );
};

// Открывает модальное окно для создания новой аннотации
const handleCreateAnnotationClick = () => {
    if (selectedLineIds.length > 0) {
        setShowAnnotationModal(true);
    }
};

// Сохраняет новую аннотацию
const handleSaveAnnotation = async () => {
    if (!currentAnnotationNote.trim()) {
        alert("Текст аннотации не может быть пустым.");
        return;
    }

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    setIsSaving(true);
    try {
        const response = await api.post(`/api/songs/${songId}/annotations/`, {
            line_ids: selectedLineIds,
            note: currentAnnotationNote,
        });

        queryClient.setQueryData(queryKey, (oldData) => {
            
            return {
                ...oldData,
                lyrics: response.data.lyrics,
                annotations: response.data.annotations,
            };
        });

        queryClient.setQueryData(['songLearn', songId], (oldData) => {
            
            return {
                ...oldData,
                lyrics: response.data.lyrics,
                annotations: response.data.annotations,
            };
        });
        
        setLyrics(response.data.lyrics);
        setAnnotations(response.data.annotations);

        // Сбрасываем состояния
        setShowAnnotationModal(false);
        setCurrentAnnotationNote("");
        setSelectedLineIds([]);
        //setIsAnnotationMode(false); // Выходим из режима аннотаций
        alert("Аннотация успешно создана!");
    } catch (error) {
        alert("Не удалось создать аннотацию. Возможно, одна из строк уже аннотирована.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
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
        setIsDirty(true);
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
            const countData = queryClient.getQueryData(['totalSongsCount']);
            const currentCount = countData?.song_count;

            if (currentCount === 1 || currentCount === undefined) {
                queryClient.removeQueries({ queryKey: ['songs', 'user'] });
                queryClient.removeQueries({ queryKey: ['totalSongsCount'] });
            } else {
                queryClient.invalidateQueries({ queryKey: ['songs', 'user'] });
                queryClient.invalidateQueries({ queryKey: ['totalSongsCount'] });
            }
            
            await queryClient.invalidateQueries({ queryKey: ['totalSongsCount'] });
            await queryClient.invalidateQueries({ queryKey: ['songs', 'user'] });
            await queryClient.invalidateQueries({ queryKey: ['songs', 'public'] });

            queryClient.removeQueries({ queryKey: ['songLearn', songId] });
            queryClient.removeQueries({ queryKey: ['editSong', songId] });
            alert("Песня успешно удалена!");
            flushSync(() => {
                setIsDirty(false);
            });
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
    if (!validateFields() || !sourceUrl.trim()) {
        if (!sourceUrl.trim()) {
            alert("Для публикации песни необходимо указать ссылку на источник текста.");
        }
        return;
    }

    const confirmed = window.confirm("Публикация песни сделает её видимой для других пользователей. Все внесённые изменения сохранятся");
    if (!confirmed) return;

    setIsSaving(true);

    try {
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) {
            setIsSaving(false);
            return;
        }

        const songUpdatePromise = api.patch(`/api/songs/${songId}/`, {
            title,
            artist,
            youtube_id: youtubeId,
            source_url: sourceUrl,
            is_published: true,
        });
        const lyricsUpdatePromise = api.post(`/api/songLyrics/update/${songId}/`, lyrics);

        const [songUpdateRes, lyricsUpdateRes] = await Promise.all([songUpdatePromise, lyricsUpdatePromise]);

        queryClient.setQueryData(queryKey, (oldData) => {
            
            return {
                ...oldData,
                lyrics: lyricsUpdateRes.data.lyrics,
                song: songUpdateRes.data,
            };
        });
        queryClient.setQueryData(['songLearn', songId], (oldData) => {
            
            return {
                ...oldData,
                lyrics: lyricsUpdateRes.data.lyrics,
                song: songUpdateRes.data,
            };
        });

        // Инвалидируем
        await queryClient.invalidateQueries({ queryKey: ['songs', 'user'] }); 
        await queryClient.invalidateQueries({ queryKey: ['songs', 'public'] });

        setLyrics(lyricsUpdateRes.data.lyrics);
        setIsDirty(false);

        alert("Песня успешно опубликована!");
        SetisPublished(true);
    } catch (err) {
        if (err.response.data.source_url) {
            alert("Ошибка. Данные не изменены. Пожалуйста, введите корректный URL в поле 'Ссылка на источник текста'.");
        }
        else alert("Ошибка. Данные не изменены.");
    } finally {
        setIsSaving(false);
    }

};

const handleAddLine = (index) => {
    const newLine = {
        tempId: `temp_${Date.now()}_${Math.random()}`,
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
    setIsDirty(true);
};


const handleChangeLine = (index, field, value) => {
    const updatedLyrics = [...lyrics];
    updatedLyrics[index][field] = value;
    setLyrics(updatedLyrics);
    setIsDirty(true);
};

const handleDeleteLine = (index) => {
    const updatedLyrics = [...lyrics];
    updatedLyrics.splice(index, 1);

    // Пересчет в порядок 1, 2 , …, n
    updatedLyrics.forEach((line, idx) => {
        line.line_number = idx + 1;
    });

    setLyrics(updatedLyrics);
    setIsDirty(true);
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
    setIsSaving(true);

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) {
        setIsSaving(false);
        return;
    }

    try {
        const songUpdatePromise = api.patch(`/api/songs/${songId}/`, {
            title,
            artist,
            youtube_id: youtubeId,
            source_url: sourceUrl,
        });
        const lyricsUpdatePromise = api.post(`/api/songLyrics/update/${songId}/`, lyrics);

        const [songUpdateRes, lyricsUpdateRes] = await Promise.all([songUpdatePromise, lyricsUpdatePromise]);

        queryClient.setQueryData(queryKey, (oldData) => {
            
            return {
                ...oldData,
                lyrics: lyricsUpdateRes.data.lyrics,
                song: songUpdateRes.data,
            };
        });
        queryClient.setQueryData(['songLearn', songId], (oldData) => {
            
            return {
                ...oldData,
                lyrics: lyricsUpdateRes.data.lyrics,
                song: songUpdateRes.data,
            };
        });

        // Инвалидируем
        await queryClient.invalidateQueries({ queryKey: ['songs', 'user'] }); 
        await queryClient.invalidateQueries({ queryKey: ['songs', 'public'] });

        setLyrics(lyricsUpdateRes.data.lyrics);
        setIsDirty(false);

        if (!isPublished) alert("Изменения сохранены!");
        else alert("Изменения сохранены и видны другим пользователям!")
    } catch (err) {
        if (err.response.data.source_url) {
            alert("Ошибка. Данные не изменены. Пожалуйста, введите корректный URL в поле 'Ссылка на источник текста'.");
        }
        else alert("Ошибка. Данные не изменены.");
    } finally {
        setIsSaving(false);
    }
};

const handleFillLyrics = async () => {
    if (!validateFields()) {
        return;
    }

    if (!window.confirm("Весь текст песни будет удалён, заполнен оригинальными строками и сохранён. Все аннотации удалятся. Продолжить?")) {
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
                const newSongData = res.data.song;
                const newLyricsData = res.data.lyrics;

                queryClient.setQueryData(queryKey, (oldData) => {
                
                    return {
                        ...oldData,
                        lyrics: newLyricsData,
                        song: newSongData,
                    };
                });

                queryClient.setQueryData(['songLearn', songId], (oldData) => {
                    
                    return {
                        ...oldData,
                        lyrics: newLyricsData,
                        song: newSongData,
                    };
                });

                await queryClient.invalidateQueries({ queryKey: ['songs', 'user'] }); 
                await queryClient.invalidateQueries({ queryKey: ['songs', 'public'] });

                setTitle(newSongData.title);
                setArtist(newSongData.artist);
                setYoutubeId(newSongData.youtube_id);
                setLyrics(newLyricsData);
                setIsDirty(false);
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

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    if (!window.confirm("Весь текст песни будет сохранен, все текущие пустые строки перевода будут заполнены автоматически и сохранены. Продолжить?")) {
        return;
    }
    
    setLoading(true);

    try {
        let finalLyricsData = null;
        const saveResponse  = await api.post(`/api/songLyrics/update/${songId}/`, lyrics);
        if (saveResponse .status === 200) {
            finalLyricsData = saveResponse.data.lyrics;
            setIsDirty(false);
        }

        const translateResponse  = await api.post(`/api/songs/translate/${songId}/`);

        if (translateResponse .data.success) {
            finalLyricsData = translateResponse.data.lyrics;
            alert("Перевод успешно завершен!");
        }
        if (finalLyricsData) {
            queryClient.setQueryData(queryKey, (oldData) => {
            
                return {
                    ...oldData,
                    lyrics: finalLyricsData
                };
            });
            queryClient.setQueryData(['songLearn', songId], (oldData) => {
                
                return {
                    ...oldData,
                    lyrics: finalLyricsData
                };
            });
            setLyrics(finalLyricsData);
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

const handleSaveAnnotationLines = async () => {
    if (selectedLineIds.length === 0) {
        alert("Должна быть выбрана хотя бы одна строка.");
        return;
    }

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    setIsSaving(true);
    try {
        const response = await api.patch(`/api/annotations/${editingAnnotationId}/`, {
            line_ids: selectedLineIds
        });


        queryClient.setQueryData(queryKey, (oldData) => {
            
            return {
                ...oldData,
                lyrics: response.data.lyrics,
            };
        });

        queryClient.setQueryData(['songLearn', songId], (oldData) => {
            
            return {
                ...oldData,
                lyrics: response.data.lyrics,
            };
        });

        setLyrics(response.data.lyrics);
        //setAnnotations(response.data.annotations);

        setIsEditingAnnotationLines(false);
        setSelectedLineIds([]);
        setEditingAnnotationId(null);
        if (!isAlreadyInAnnotationMode)
        {
            setIsAnnotationMode(false)
        }

        alert("Строки аннотации обновлены!");
    } catch (error) {
        alert("Не удалось обновить строки аннотации.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
};

const handlePreview = () => {
        const fromTab = 'home'; 
        const previewUrl = `/song/${songId}`;
        navigate(previewUrl, { state: { from: fromTab } });
    };

    if (isLoading || loading) {
        return (
            <div className={styles.pageContainer}>  
                <LoadingIndicator />
                <BottomNavigation active="home" />
            </div>
        );
    }

return (
    <div className={styles.pageContainer}>
        <div className={styles.metaFields}>
            <label className={styles.metaLabel}>
                Название:
                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setIsDirty(true);
                    }}
                    className={styles.metaInput}
                    disabled={isAnnotationMode} // Блокируем редактирование в режиме аннотаций
                />
            </label>
            <label className={styles.metaLabel}>
                Исполнитель:
                <input
                    type="text"
                    value={artist}
                    onChange={(e) => {
                        setArtist(e.target.value);
                        setIsDirty(true);
                    }}
                    className={styles.metaInput}
                    disabled={isAnnotationMode} // Блокируем редактирование в режиме аннотаций
                />
            </label>
            <label className={styles.metaLabel}>
                Ссылка на источник текста:
                <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => {
                        setSourceUrl(e.target.value);
                        setIsDirty(true);
                    }}
                    placeholder="https://..."
                    className={styles.metaInput}
                    disabled={isAnnotationMode} // Блокируем редактирование в режиме аннотаций
                />
            </label>
            <label className={styles.metaLabel}>
                ID видео с ютуба:
                <input
                    type="text"
                    value={youtubeId}
                    onChange={(e) => {
                        setYoutubeId(e.target.value);
                        setIsDirty(true);
                    }}
                    className={styles.metaInput}
                    disabled={isAnnotationMode} // Блокируем редактирование в режиме аннотаций
                />
            </label>
            <label className={styles.metaLabel}>
                <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Ссылка на песню на YouTube"
                    className={styles.metaInput}
                    disabled={isAnnotationMode} // Блокируем редактирование в режиме аннотаций
                />
            </label>
            <button onClick={handleParseYoutubeUrl} className={styles.addButton} disabled={isAnnotationMode}>
                Извлечь ID
            </button>
        </div>
        <div>&nbsp;</div>
        <div>&nbsp;</div>

        {isVip && (
        <>
        <div className={styles.buttonGroup}>
            <button className={styles.addButton} onClick={handleFillLyrics} disabled={isAnnotationMode}>
                Заполнить текст с нуля
            </button>
            <div>&nbsp;</div>
            <button className={styles.addButton} onClick={handleFillTranslations} disabled={isAnnotationMode}>
                Заполнить пустые строки перевода
            </button>
        </div>
        <div>&nbsp;</div>
        <div>&nbsp;</div>
        </>
        )}

        <div className={styles.iconRowNotSticky}>
            <div className={styles.iconContainer} onClick={handleDeleteSong}>
                <img src={DeleteIcon} alt="Удалить" />
                <span className={styles.iconLabel}>Удалить</span>
            </div>

            {!isPublished && isVip && (<div className={styles.iconContainer} onClick={handlePublishSong}>
                <img src={PublishIcon} alt="Опубликовать" />
                <span className={styles.iconLabel}>Опубликовать</span>
            </div>
            )}
        </div>

         <div className={styles.iconRowSticky} ref={iconRowStickyRef}>
            <div className={styles.iconContainer} onClick={toggleAnnotationMode}>
                <img src={HighlighterIcon} alt="Аннотации" />
                <span className={styles.iconLabel}>Аннотации</span>
            </div>

            <div className={styles.iconContainer} onClick={handlePreview}>
                <img src={EyeIcon} alt="Предварительный просмотр" />
                <span className={styles.iconLabel}>Просмотр</span>
            </div>
        </div>

        {isAnnotationMode ? (
            <h2 className={styles.h2text}>Режим аннотаций</h2>
        ) : (
            <h2 className={styles.h2text}>Редактирование текста</h2>
        )}
        <button className={styles.addButton} onClick={() => onAddLine(index + 1)} disabled={isAnnotationMode}>
            Добавить строку
        </button>
        {lyrics.map((line, index) => (
            <EditSongLyricsLine
                line={line}
                onChange={handleChangeLine}
                onAddLine={handleAddLine}
                onDeleteLine={requestDeleteLine}
                index={index}
                key={line.id || line.tempId} // Используем line.id, если он есть
                // --- НОВЫЕ ПРОПСЫ ---
                isAnnotationMode={isAnnotationMode}
                isSelected={selectedLineIds.includes(line.id)}
                onSelect={handleLineSelect}    
                onAnnotationClick={handleOpenAnnotationToEdit}
                hoveredAnnotationId={hoveredAnnotationId}
                onHoverAnnotation={setHoveredAnnotationId}
                isEditingAnnotationLines={isEditingAnnotationLines}
                selectedLineIds={selectedLineIds}
                editingAnnotationId={editingAnnotationId}
            />
        ))}
      
        {/* --- ПАНЕЛЬ УПРАВЛЕНИЯ АННОТАЦИЯМИ (появляется снизу) --- */}
        {isAnnotationMode && (
            <div className={`${styles.annotationPanel} fixed-class`}>
                {isEditingAnnotationLines ? (
                    <>
                        <button
                            className={styles.createAnnotationButton}
                            onClick={handleSaveAnnotationLines}
                            disabled={selectedLineIds.length === 0 || isSaving}
                        >
                            {isSaving ? "Сохранение..." : `Сохранить (${selectedLineIds.length})`}
                        </button>
                        <button
                            className={styles.cancelAnnotationButton}
                            onClick={() => {
                                setIsEditingAnnotationLines(false);
                                setSelectedLineIds([]);
                                if (!isAlreadyInAnnotationMode)
                                {
                                    setIsAnnotationMode(false)
                                }
                                setEditingAnnotationId(null);
                            }}
                        >
                            Отмена
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className={styles.createAnnotationButton}
                            onClick={handleCreateAnnotationClick}
                            disabled={selectedLineIds.length === 0}
                        >
                            Создать ({selectedLineIds.length})
                        </button>
                        <button
                            className={styles.cancelAnnotationButton}
                            onClick={toggleAnnotationMode}
                        >
                            Выйти из режима
                        </button>
                    </>
                )}
            </div>
        )}

        {showAnnotationModal && (
            <div className={styles.overlay}>
                <div className={styles.annotationModal}>
                    {/* Заголовок меняется в зависимости от того, создаем мы или редактируем */}
                    <h3 className={styles.formTitle}>
                        {editingAnnotationId ? "Редактировать аннотацию" : "Новая аннотация"}
                    </h3>
                    <textarea
                        className={styles.annotationTextarea}
                        value={currentAnnotationNote}
                        onChange={(e) => setCurrentAnnotationNote(e.target.value)}
                    />
                    <div className={styles.formActions}>
                        {/* 
                        Кнопка "Сохранить" теперь вызывает либо создание, либо обновление
                        */}
                        <button
                            className={styles.saveAnnotationButton}
                            onClick={editingAnnotationId ? handleUpdateAnnotation : handleSaveAnnotation}
                            disabled={isSaving || isDeleting || !currentAnnotationNote.trim()}
                        >
                            { isDeleting
                                ? "Удаление..."
                                : isSaving
                                    ? "Сохранение..."
                                    : "Сохранить"
                            }
                        </button>
                        <button
                            className={styles.cancelAnnotationButton}
                            onClick={closeAnnotationModal} // Используем новую функцию
                        >
                            Закрыть
                        </button>
                    </div>
                    {/* Кнопка удаления появляется только в режиме редактирования */}
                    {editingAnnotationId && (
                    <>
                        <div className={styles.iconRowAnnotation}>
                            <div className={styles.iconContainer} onClick={handleDeleteAnnotation}>
                                <img src={DeleteIcon} alt="Удалить" />
                                <span className={styles.iconLabel}>Удалить</span>
                            </div>
                            <div
                                className={styles.iconContainer}
                                onClick={() => {
                                    if (isDirty) {
                                        alert("Пожалуйста, сохраните изменения в тексте песни, прежде чем работать с аннотациями.");
                                        return;
                                    }
                                    setIsEditingAnnotationLines(true);
                                    setIsAnnotationMode(true);
                                    setShowAnnotationModal(false);
                                    // Находим строки, которые уже есть у аннотации
                                    const annotation = annotations.find(a => a.id === editingAnnotationId);
                                    setSelectedLineIds(annotation.lines || []);
                                }}>
                                <img src={LinesIcon} alt="Изменить строки" />
                                <span className={styles.iconLabel}>Изменить строки</span>
                            </div>
                        </div>
                    </>
                    )}
                </div>
            </div>
        )}

        {!isAnnotationMode && (
            <img 
                className={`${styles.saveIcon } ${isSaving ? styles.disabled : ''} fixed-class`}
                onClick={isSaving ? null : handleSave} // Отключаем клик во время сохранения
                src={SaveIcon} 
                alt="Сохранить" 
            />
        )}
        
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
        <BottomNavigation active="home" />
    </div>
);
}
export default EditSong;