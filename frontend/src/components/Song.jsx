import React from "react";
//import "../styles/Song.css"

function Song({ song, onDelete, onEdit }) {

    return (
        <div className="song-container">
            <p className="song-title">{song.title}</p>
            <p className="song-artist">{song.artist}</p>
            <button className="edit-button" onClick={() => onEdit(song.id)}>
                Редактировать текст
            </button>
            <button className="delete-button" onClick={() => onDelete(song.id)}>
                Удалить
            </button>
        </div>
    );
}

export default Song