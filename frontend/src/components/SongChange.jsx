import React, { useEffect, useRef } from "react";
import styles from "../styles/SongChange.module.css";

function SongChange({ song, onEdit }) {

    return (
        <div className={styles.songContainer} onClick={() => onEdit(song.id)}>
            <div>
                <p className={styles.songTitle}>{song.title}</p>
                <p className={styles.songArtist}>{song.artist}</p>
            </div>
            
            { !song.is_published && (
                    <span className={styles.unpublishedLabel}>Не опубликовано</span>
            )}
        </div>
    );
}

export default SongChange;