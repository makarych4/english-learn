import { useNavigate } from "react-router-dom";

function SongItem({ song }) {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(`/song/${song.id}`);
    };

    return (
        <div onClick={handleClick} className="song-item">
            <p className="song-title">{song.title}</p>
            <p className="song-artist">{song.artist}</p>
        </div>
    );
}

export default SongItem;