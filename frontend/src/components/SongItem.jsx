import { useNavigate } from "react-router-dom";
import styles from "../styles/SongItem.module.css";

function SongItem({ song, onClick }) {
    const navigate = useNavigate();
    
    const handleClick = () => {
        // Сценарий 1: Песня - группа с одной версией (у нее есть и count=1, и id)
        if (song.count === 1 && song.id) {
            navigate(`/song/${song.id}`);
            return; // Завершаем выполнение
        }

        // Сценарий 2: Песня - группа с несколькими версиями (есть onClick)
        if (onClick) {
            onClick(song); 
            return; // Завершаем выполнение
        }
        
        // Сценарий 3: Это конечная песня ("Версия 1")
        if (song.id) {
            navigate(`/song/${song.id}`);
        }
    };

    return (
        <div onClick={handleClick} className={styles.songItem}>
            {
                song.original_title ? (
                    <p className={styles.centeredTitle}>{song.title}</p>

                ) : (
                    <>
                        <div>
                            <p className={styles.songTitle}>{song.title}</p>
                            <p className={styles.songArtist}>{song.artist}</p>
                        </div>
                        {song.count > 1 && (<span className={styles.versionCount}>{song.count}</span>)}
                    </>
                )
            }
        </div>
    );
}

export default SongItem;