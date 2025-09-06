import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom"; 
import { useQueryClient, useQuery } from '@tanstack/react-query';
import api from "../api";
import SongLyricsLine from "../components/SongLyricsLine";
import YouTubePlayer from "../components/YouTubePlayer";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import { checkOwnership } from '../utils/authUtils';
import  ensureAuth  from '../utils/authUtils';
import styles from '../styles/SongLearn.module.css';

import EditIcon from "../assets/pencil.svg";
import CloseIcon from "../assets/close2.svg";

function SongLearn() {
    const [youtubeError, setYoutubeError] = useState(false);
    const { songId } = useParams();

    //const [annotations, setAnnotations] = useState([]);
    const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);
    const [activeAnnotation, setActiveAnnotation] = useState(null); // Для открытого окна
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const queryKey = ['songLearn', songId];
    const queryClient = useQueryClient();

    const fetchSongLearnData = async ({ signal }) => {
        const isOwner = await checkOwnership(songId);

        const lyricsUrl = isOwner ? `/api/songLyrics/${songId}/` : `/api/songLyrics/public/${songId}/`;
        const songUrl = isOwner ? `/api/songs/${songId}/` : `/api/songs/public/${songId}/`;
        const annotationsUrl = `/api/songs/${songId}/annotations/`;

        const [lyricsRes, songRes, annotationsRes] = await Promise.all([
            api.get(lyricsUrl, { signal }),
            api.get(songUrl, { signal }),
            api.get(annotationsUrl, { signal })
        ]);

        return {
            lyrics: lyricsRes.data,
            song: songRes.data,
            annotations: annotationsRes.data,
            isOwner: isOwner,
        };
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: queryKey,
        queryFn: fetchSongLearnData,
        staleTime: 10 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    if (isError && error.name !== 'CanceledError') {
        alert("Не удалось загрузить данные песни. Возможно, она не существует.");
        navigate("/search");
        return null; // Рендерим ничего во время редиректа
    }

    // Используем деструктуризацию с значениями по умолчанию для безопасности
    const {
        lyrics = [],
        song: songData = {},
        annotations = [],
        isOwner = false,
    } = data || {}; // `|| {}` на случай, если data еще undefined

    const handleAnnotationClick = (annotationId) => {
        const annotation = annotations.find(anno => anno.id === annotationId);
        if (annotation) {
            setActiveAnnotation(annotation); // Показываем модальное окно с данными
        }
    };

    const closeAnnotation = () => {
        setActiveAnnotation(null);
    };

    const handleEditOrClone = async () => {
        if (isOwner) {
            const isAuth = await ensureAuth(navigate);
            if (!isAuth) return;

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
                            const countData = queryClient.getQueryData(['totalSongsCount']);
                            const currentCount = countData?.song_count;

                            if (currentCount === 0 || currentCount === undefined) {
                                queryClient.removeQueries({ queryKey: ['songs', 'user'] });
                            } else {
                                queryClient.invalidateQueries({ queryKey: ['songs', 'user'] });
                            }
                            queryClient.invalidateQueries({ queryKey: ['totalSongsCount'] });

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
            {isLoading || loading ? (
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

                    {/* --- ОТОБРАЖЕНИЕ ССЫЛКИ --- */}
                    {songData.source_url && (
                        <div className={styles.sourceLinkContainer}>
                            <a 
                                href={songData.source_url} 
                                target="_blank" // Открывать в новой вкладке
                                rel="noopener noreferrer" // Для безопасности
                                className={styles.sourceLink}
                            >
                                Источник текста
                            </a>
                        </div>
                    )}

                    <div className={styles.container}>
                        {lyrics.map((line, index) => (
                            <div key={line.id}>
                                <SongLyricsLine
                                line={line}
                                onAnnotationClick={handleAnnotationClick}
                                hoveredAnnotationId={hoveredAnnotationId}
                                onHoverAnnotation={setHoveredAnnotationId}
                            />
                                {index < lyrics.length - 1 && <hr className={styles.lineSeparator} />}
                            </div>
                            
                        ))}
                    </div>

                    {songData.youtube_id && !youtubeError && (<YouTubePlayer videoId={songData.youtube_id} />)}     
                </>
            )}
            {activeAnnotation && (
                <div className={styles.annotationOverlay} onClick={closeAnnotation}>
                    <div className={styles.annotationModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.closeButton} onClick={closeAnnotation}>
                            <img src={CloseIcon} alt="Закрыть" />
                        </div>
                        <div className={styles.annotationContent}>
                            {activeAnnotation.note}
                        </div>
                    </div>
                </div>
            )}
            <BottomNavigation active={activeTab} />
        </div>
    );
}

export default SongLearn;
