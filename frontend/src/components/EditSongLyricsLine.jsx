//import "../styles/EditSongLyricsLine.css"

function EditSongLyricsLine({ line, index, onChange, onAddLine, onDeleteLine }) {
    return (
        <>
            <p className="number-line">
                Строка {line.line_number}:
            </p>
            <input
                className="original-line"
                type="text"
                value={line.original_line}
                onChange={(e) => onChange(index, "original_line", e.target.value)}
                placeholder="Оригинальная строка"
            />
            <input
                className="translation-line"
                type="text"
                value={line.translated_line}
                onChange={(e) => onChange(index, "translated_line", e.target.value)}
                placeholder="Перевод"
            />
            <button className="add-button" onClick={() => onAddLine(index + 1)}>
                Добавить строку
            </button>
            <button className="delete-button" onClick={() => onDeleteLine(index)}>
                Удалить строку
            </button>
        </>
    );
}

export default EditSongLyricsLine;