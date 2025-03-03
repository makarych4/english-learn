import { useState, useEffect } from "react";
import api from "../api";
import SongLyrics from "../components/SongLyrics"
//import "../styles/Song.css"

function Song() {
    const [songLyrics, setSongLyrics] = useState([]);
    const [originalLine, setOriginalLine] = useState("");
    const [translatedLine, setTranslatedLine] = useState("");
    const [lineNumber, setLineNumber] = useState();

    useEffect(() => {
        getSongLyrics();
    }, []);

    const getSongLyrics = () => {
        api
            .get("/api/songLyrics/")
            .then((res) => res.data)
            .then((data) => {
              setSongLyrics(data);
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    const deleteSongLyrics = (id) => {
        api
            .delete(`/api/songLyrics/delete/${id}/`)
            .then((res) => {
                if (res.status === 204) alert("Строка удалена!");
                else alert("Не удалось удалить песню");
                getSongs();
            })
            .catch((error) => alert(error));
        
    };

    const createSong = (e) => {
        e.preventDefault();
        api
            .post("/api/songs/", { title, artist })
            .then((res) => {
                if (res.status === 201) alert("Песня создана!");
                else alert("Не удалось создать песню");
                getSongs();
            })
            .catch((err) => alert(err));
    };

    return (
        <div>
            <div>
                <h2>Песни</h2>
                {songs.map((song) => (
                    <Song song={song} onDelete={deleteSong} key={song.id} />
                ))}
            </div>
            <h2>Создать песню</h2>
            <form onSubmit={createSong}>
                <label htmlFor="title">Название:</label>
                <br />
                <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                />
                <label htmlFor="artist">Исполнитель:</label>
                <br />
                <input
                    id="artist"
                    name="artist"
                    required
                    onChange={(e) => setArtist(e.target.value)}
                    value={artist}
                />
                <br />
                <input type="submit" value="Submit"></input>
            </form>
        </div>
    );
}

export default Song;
