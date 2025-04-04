import { useNavigate } from "react-router-dom";
import styles from "../styles/SongItem.module.css";

function SongItem({ song }) {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(`/song/${song.id}`);
    };

    return (
        <div onClick={handleClick} className={styles.songItem}>
            <p className={styles.songTitle}>{song.title}</p>
            <p className={styles.songArtist}>{song.artist}</p>
        </div>
    );
}

export default SongItem;