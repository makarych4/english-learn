import styles from "../styles/EditSongLyricsLine.module.css"

function EditSongLyricsLine({ line, index, onChange, onAddLine, onDeleteLine }) {
    return (
        <>
            <div className={styles.lineHeader}>
                <span className={styles.numberLine}>Строка {line.line_number}:</span>
                <button
                    className={styles.deleteIcon}
                    onClick={() => onDeleteLine(index)}
                    aria-label="Удалить строку"
                >
                    ✖
                </button>
            </div>



            <input
                className={styles.originalLine}
                type="text"
                value={line.original_line}
                onChange={(e) => onChange(index, "original_line", e.target.value)}
                placeholder="Оригинальная строка"
            />
            <input
                className={styles.translationLine}
                type="text"
                value={line.translated_line}
                onChange={(e) => onChange(index, "translated_line", e.target.value)}
                placeholder="Перевод"
            />
            <button className={styles.addButton} onClick={() => onAddLine(index + 1)}>
                Добавить строку
            </button>
            {/* <button className={styles.deleteButton} onClick={() => onDeleteLine(index)}>
                Удалить строку
            </button> */}
        </>
    );
}

export default EditSongLyricsLine;