import styles from '../styles/SongLyricsLine.module.css';

function SongLyricsLine({ line }) {
    return (
        <>
            <p className={styles.originalLine}>
                {line.original_line}
            </p>
            
            <p className={styles.translatedLine}>
                {line.translated_line}
            </p>
        </>
    );
}

export default SongLyricsLine;