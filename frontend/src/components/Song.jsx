import React from "react";
import { useNavigate } from "react-router-dom";

function Song({ song, onDelete }) {
    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`/edit-song/${song.id}`);
    };

    return (
        <div className="song-container">
            <p className="song-title">{song.title}</p>
            <p className="song-artist">{song.artist}</p>
            <button className="delete-button" onClick={handleEdit}>
                Редактировать текст
            </button>
            <button className="delete-button" onClick={() => onDelete(song.id)}>
                Удалить
            </button>
        </div>
    );
}

export default Song