import { useState, useEffect } from "react";
import api from "../api";
import Song from "../components/Song"
//import "../styles/Home.css"

function Home() {
    const [songs, setSongs] = useState([]);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");

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

export default Home;
