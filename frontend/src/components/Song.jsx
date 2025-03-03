import React from "react";

function Song({ song, onDelete }) {

    return (
        <div className="song-container">
            <p className="song-title">{song.title}</p>
            <p className="song-artist">{song.artist}</p>
            <button className="delete-button" onClick={() => onDelete(song.id)}>
                Delete
            </button>
        </div>
    );
}

export default Song