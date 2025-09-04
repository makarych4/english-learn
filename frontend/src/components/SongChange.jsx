import { useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/SongChange.module.css";

function SongChange({ song, onClick, activeTab }) {
    const navigate = useNavigate();
    
    const handleClick = () => {
        // Сценарий 1: Песня - группа с одной версией (у нее есть и count=1, и id)
        if (song.count === 1 && song.id) {
            navigate(`/song/${song.id}`, { state: { from: activeTab } });
            return; // Завершаем выполнение
        }

        // Сценарий 2: Песня - группа с несколькими версиями (есть onClick)
        if (onClick) {
            onClick(song); 
            return; // Завершаем выполнение
        }
        
        // Сценарий 3: Это конечная песня ("Версия 1")
        if (song.id) {
            navigate(`/song/${song.id}`, { state: { from: activeTab } });
        }
    };

    const isTouchDevice = typeof window !== "undefined" && 
                      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    return (
        <div
            className={styles.songContainer}
            onClick={handleClick}
            {...(isTouchDevice && {
            onTouchStart: (e) => e.currentTarget.classList.add(styles.active),
            onTouchEnd: (e) => e.currentTarget.classList.remove(styles.active),
            onTouchCancel: (e) => e.currentTarget.classList.remove(styles.active),
            })}
        >
            {song.original_title ? (
                    <p className={styles.centeredTitle}>{song.title}</p>

                ) : (
                        <div className={styles.songInfo}>
                            <p className={styles.songTitle}>{song.title}</p>
                            <p className={styles.songArtist}>{song.artist}</p>
                        </div>)}
            
            { song.count > 1 ? (
                    <span className={styles.versionCount}>{song.count}</span>
            ) : (
                <>
                     {!song.is_published && (<span className={styles.unpublishedLabel}>Не опубликовано</span>)}
                </>
            )}
        </div>
    );
}

export default SongChange;