function SongLyricsLine({ line, index, onChange, onAddLine, onDeleteLine }) {
    return (
        <div>
            <p>Строка {line.line_number}:</p>
            <input
                type="text"
                value={line.original_line}
                onChange={(e) => onChange(index, "original_line", e.target.value)}
                placeholder="Оригинальная строка"
            />
            <input
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
        </div>
    );
}

export default SongLyricsLine;

// import React from "react";

// function SongLyrics({ songLyrics, onDelete, onAddLine}) {

//     return (
//         <div className="lyrics-container">
//             <p className="lyrics-original">{songLyrics.originalLine}</p>
//             <p className="lyrics-translated">{songLyrics.translatedLine}</p>
//             <p className="lyrics-number">{songLyrics.lineNumber}</p>
//             <button className="delete-button" onClick={() => onDelete(songLyrics.id)}>
//                 Удалить
//             </button>
//             <button className="add-button" onClick={() => onAddLine(songLyrics.lineNumber)}>
//                 Добавить строку
//             </button>
//         </div>
//     );
// }

// export default SongLyrics