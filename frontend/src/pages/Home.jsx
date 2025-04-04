import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Song from "../components/Song"
import BottomNavigation from '../components/BottomNavigation';
//import "../styles/Home.css"

function Home() {
    const [songs, setSongs] = useState([]);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [videoId, setVideoId] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        getSongs();
    }, []);

    const getSongs = () => {
        api
            .get("/api/songs/")
            .then((res) => res.data)
            .then((data) => {
                setSongs(data);
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    const editSong = (id) => {
        navigate(`/edit-song/${id}`)
    };

    const deleteSong = (id) => {
        api
            .delete(`/api/songs/delete/${id}/`)
            .then((res) => {
                if (res.status === 204) alert("Песня удалена!");
                else alert("Не удалось удалить песню");
                getSongs();
            })
            .catch((error) => alert(error));
        
    };

    const createSong = (e) => {
        e.preventDefault();
        api
            .post("/api/songs/", { title, artist, youtube_id: videoId })
            .then((res) => {
                if (res.status === 201) alert("Песня создана!");
                else alert("Не удалось создать песню");
                getSongs();
            })
            .catch((err) => alert(err));
    };

    return (
        <>
            <div className="songs-block">
                <h2>Песни</h2>
                {songs.map((song) => (
                    <Song
                        song={song}
                        onEdit={editSong}
                        onDelete={deleteSong}
                        key={song.id}
                    />
                ))}
            </div>
            <h3>Создать песню</h3>
            <form onSubmit={createSong} className="form-container">
                <label htmlFor="title" className="form-label">
                    Название:
                </label>
                <br />
                <input
                    className="form-input"
                    type="text"
                    id="title"
                    name="title"
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                />
                <br />
                <label htmlFor="artist" className="form-label">
                    Исполнитель:
                </label>
                <br />
                <input
                    className="form-input"
                    id="artist"
                    name="artist"
                    required
                    onChange={(e) => setArtist(e.target.value)}
                    value={artist}
                />
                <br />
                <label htmlFor="title" className="form-label">
                    id видео с YouTube:
                </label>
                <br />
                <input
                    className="form-input"
                    type="text"
                    id="videoId"
                    name="videoId"
                    required
                    onChange={(e) => setVideoId(e.target.value)}
                    value={videoId}
                />
                <br />
                <input
                    className="form-submit"
                    type="submit"
                    value="Создать"
                />
            </form>
            <div className="mobile-only">
                <BottomNavigation active="home" />
            </div>
            
        </>
    );
}

export default Home;
