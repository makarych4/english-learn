import React from "react";

function SongLyrics({ songLyrics, onDelete }) {

    return (
        <div className="lyrics-container">
            <p className="lyrics-original">{songLyrics.originalLine}</p>
            <p className="lyrics-translated">{songLyrics.translatedLine}</p>
            <p className="lyrics-number">{songLyrics.lineNumber}</p>
            <button className="delete-button" onClick={() => onDelete(songLyrics.id)}>
                Удалить
            </button>
        </div>
    );
}

export default SongLyrics