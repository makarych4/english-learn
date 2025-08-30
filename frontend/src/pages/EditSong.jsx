import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import api from "../api";
import EditSongLyricsLine from "../components/EditSongLyricsLine";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import ensureAuth from "../utils/authUtils";
import styles from "../styles/EditSong.module.css"
import DeleteIcon from "../assets/trash.svg";
import PublishIcon from "../assets/publish.svg";
import LinesIcon from "../assets/lines.svg";
import SaveIcon from "../assets/save.svg";
import EyeIcon from "../assets/eye.svg";
import HighlighterIcon from "../assets/highlighter.svg";
function EditSong() {
const [lyrics, setLyrics] = useState([]);
const [title, setTitle] = useState("");
const [artist, setArtist] = useState("");
const [youtubeId, setYoutubeId] = useState("");
const [isPublished, SetisPublished] = useState("");
const [sourceUrl, setSourceUrl] = useState("");
const [confirmDeleteLineId, setConfirmDeleteLineId] = useState(null);
const [loading, setLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [isVip, setIsVip] = useState(false);
const { songId } = useParams();
const [youtubeUrl, setYoutubeUrl] = useState("");
const [isDirty, setIsDirty] = useState(false); // Флаг несохраненных изменений

// --- СОСТОЯНИЯ ДЛЯ АННОТАЦИЙ --- //
const [isAnnotationMode, setIsAnnotationMode] = useState(false);
const [isAlreadyInAnnotationMode, setIsAlreadyInAnnotationMode] = useState(false);
const [selectedLineIds, setSelectedLineIds] = useState([]);
const [showAnnotationModal, setShowAnnotationModal] = useState(false);
const [currentAnnotationNote, setCurrentAnnotationNote] = useState("");
const [annotations, setAnnotations] = useState([]); 
const [editingAnnotationId, setEditingAnnotationId] = useState(null);
const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);

const [isEditingAnnotationLines, setIsEditingAnnotationLines] = useState(false);

const navigate = useNavigate();

const blocker = useBlocker(isDirty);

useEffect(() => {
        // Этот эффект теперь будет обрабатывать логику подтверждения
        if (blocker && blocker.state === 'blocked') {
            // Показываем стандартное диалоговое окно
            if (window.confirm("У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?")) {
                blocker.proceed(); // Если "ОК", разрешаем переход
            } else {
                blocker.reset(); // Если "Отмена", сбрасываем блокировку
            }
        }
    }, [blocker]);

useEffect(() => {
    const handleBeforeUnload = (e) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = ""; // Стандартное поведение для отображения диалога
        }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
    };
}, [isDirty]);

useEffect(() => {
        // Определяем, видимо ли хоть одно модальное окно
        const isOverlayVisible = showAnnotationModal || confirmDeleteLineId !== null;

        if (isOverlayVisible) {
            // Блокируем скролл на <body>
            document.body.style.overflow = 'hidden';
        } else {
            // Возвращаем скролл
            document.body.style.overflow = 'auto';

        }

        // Функция очистки на случай, если пользователь уйдет со страницы
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showAnnotationModal, confirmDeleteLineId]);

useEffect(() => {
    const initialLoad = async () => {
    setLoading(true); // Показываем индикатор только при первой загрузке
    await getLyrics(); // Вызываем нашу общую функцию
    setLoading(false);
};

initialLoad();
}, [songId]);

const getLyrics = async () => {
    
    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    api.get('/api/user/')
        .then((res) => {
            setIsVip(res.data.is_vip);
        })
        .catch((err) => {
            console.log("Ошибка при получении пользователя", err);
        });
    
    try {
        // Запускаем все три запроса параллельно
        const [lyricsRes, songRes, annotationsRes] = await Promise.all([
            api.get(`/api/songLyrics/${songId}/`),
            api.get(`/api/songs/${songId}/`),
            api.get(`/api/songs/${songId}/annotations/`)
        ]);

        // Устанавливаем все данные после того, как ВСЕ запросы завершились
        setLyrics(lyricsRes.data);
        
        const songData = songRes.data;
        setTitle(songData.title);
        setArtist(songData.artist);
        setYoutubeId(songData.youtube_id);
        SetisPublished(songData.is_published);
        setSourceUrl(songData.source_url || "");
        
        setAnnotations(annotationsRes.data);

    } catch (err) {
        console.error("Ошибка при обновлении данных песни:", err);
        alert("Не удалось обновить данные.");
    }
};

const handleOpenAnnotationToEdit = (annotationId) => {
    const annotation = annotations.find(anno => anno.id === annotationId);
    if (annotation) {
        if (!isEditingAnnotationLines) {
            // Запоминаем ID того, что редактируем
            setEditingAnnotationId(annotationId);
        }
        setCurrentAnnotationNote(annotation.note); // Заполняем поле текстом
        setShowAnnotationModal(true); // Показываем модальное окно
    }
};

// Обновляет текст существующей аннотации
const handleUpdateAnnotation = async () => {
    if (!editingAnnotationId) return;

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    setIsSaving(true);
    try {
        // Используем PATCH для частичного обновления
        const response = await api.patch(`/api/annotations/${editingAnnotationId}/`, { note: currentAnnotationNote });
        setAnnotations(response.data.annotations);

        closeAnnotationModal(); // Закрываем и сбрасываем все
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
        setAnnotations(response.data);
        // После успешного сохранения перезагружаем данные, чтобы увидеть аннотации
        await getLyrics();
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
    if (!validateFields() || !sourceUrl.trim()) {
        if (!sourceUrl.trim()) {
            alert("Для публикации песни необходимо указать ссылку на источник текста.");
        }
        return;
    }

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    const confirmed = window.confirm("Публикация песни сделает её видимой для других пользователей. Все внесённые изменения сохранятся");
    if (!confirmed) return;

    setIsSaving(true);

    try {
        await api.patch(`/api/songs/${songId}/`, {
            title,
            artist,
            youtube_id: youtubeId,
            source_url: sourceUrl,
        });

        // Сохраняем текст песни
        await api.post(`/api/songLyrics/update/${songId}/`, lyrics);

        // только после успешного сохранения - публикуем
        await api.patch(`/api/songs/${songId}/`, { is_published: true });
        alert("Песня успешно опубликована!");
        SetisPublished(true);
    } catch (err) {
        if (err.response.data.source_url) {
            alert("Пожалуйста, введите корректный URL в поле 'Ссылка на источник текста'.");
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
        return;
    }

    try {
        await api.patch(`/api/songs/${songId}/`, {
            title,
            artist,
            youtube_id: youtubeId,
            source_url: sourceUrl,
        });
        const response = await api.post(`/api/songLyrics/update/${songId}/`, lyrics);
        setLyrics(response.data.lyrics);
        setAnnotations(response.data.annotations);
        setIsDirty(false);

        if (!isPublished) alert("Изменения сохранены!");
        else alert("Изменения сохранены и видны другим пользователям!")
    } catch (err) {
        if (err.response.data.source_url) {
            alert("Пожалуйста, введите корректный URL в поле 'Ссылка на источник текста'.");
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

    if (!window.confirm("Уверен? 🤔")) {
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

    if (!window.confirm("Уверен? 🤔")) {
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

        setLyrics(response.data.lyrics);
        setAnnotations(response.data.annotations);

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
                    {!isAnnotationMode && (<button onClick={handleParseYoutubeUrl} className={styles.addButton}>
                        Извлечь ID
                    </button>)}
                </div>
                <div>&nbsp;</div>
                <div>&nbsp;</div>

                {isVip && !isAnnotationMode && (
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

                    {/* Новая иконка для режима аннотаций */}
                    <div className={styles.iconContainer} onClick={toggleAnnotationMode}>
                        <img src={HighlighterIcon} alt="Аннотации" />
                        <span className={styles.iconLabel}>Аннотации</span>
                    </div>

                    <div className={styles.iconContainer} onClick={handlePreview}>
                        <img src={EyeIcon} alt="Предварительный просмотр" />
                        <span className={styles.iconLabel}>Просмотр</span>
                    </div>

                    {!isPublished && isVip && (<div className={styles.iconContainer} onClick={handlePublishSong}>
                        <img src={PublishIcon} alt="Опубликовать" />
                        <span className={styles.iconLabel}>Опубликовать</span>
                    </div>
                    )}
                </div>

                {isAnnotationMode ? (
                    <h2 className={styles.h2text}>Режим аннотаций</h2>
                ) : (
                    <h2 className={styles.h2text}>Редактирование текста</h2>
                )}
                {!isAnnotationMode && (<button className={styles.addButton} onClick={() => handleAddLine(0)}>
                    Добавить строку
                </button>)}
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
                                    disabled={isSaving || isDeleting || !currentAnnotationNote}
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
            </>
        )}
        <BottomNavigation active="home" />
    </div>
);
}
export default EditSong;