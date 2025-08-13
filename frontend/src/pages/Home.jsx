import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import BottomNavigation from '../components/BottomNavigation';
import WordFrequencyChart from '../components/WordFrequencyChart';
import SearchBarHome from "../components/SearchBarHome";
import ensureAuth from "../utils/authUtils";
import styles from "../styles/Home.module.css";

function Home() {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [showChart, setShowChart] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
    }, []);
    
    const createSong = async (e) => {
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        e.preventDefault();
        api
            .post("/api/songs/", { title, artist})
            .then((res) => {
                if (res.status === 201) {
                    const newSongId = res.data.id; 
                    navigate(`/edit-song/${newSongId}`);
                }
                else alert("Не удалось создать песню");
                setShowForm(false);
                setTitle("");
                setArtist("");
            })
            .catch((err) => alert(err));
    };

    return (
        <div className={styles.pageContainer}>
            <button className={`${styles.chartButton} fixed-class`} onClick={() => setShowChart(true)}>График</button>


            <h2>Мои Песни</h2>

            <SearchBarHome/>

            {showForm && (
                <div className={styles.overlay}>
                    <form onSubmit={createSong} className={styles.formContainer}>
                        <button
                            type="button"
                            className={styles.closeIcon}
                            onClick={() => setShowForm(false)}
                        >
                            ✕
                        </button>

                        <h3 className={styles.formTitle}>Создать песню</h3>

                        <label htmlFor="title">Название:</label>
                        <input
                            id="title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <label htmlFor="artist">Исполнитель:</label>
                        <input
                            id="artist"
                            required
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                        />

                        <button type="submit" className={styles.createButton}>
                                Создать
                        </button>

                    </form>
                </div>
            )}
            {showChart && (
                <div className={styles.overlay}>
                    <div className={styles.chartWrapper}>
                        <button className={styles.closeButton} onClick={() => setShowChart(false)}>✕</button>
                        <WordFrequencyChart />
                    </div>
                </div>
            )}

            <button className={`${styles.fab} fixed-class`} onClick={() => setShowForm(true)}>+</button>
            <BottomNavigation active="home" />
        </div>
    );
}

export default Home;