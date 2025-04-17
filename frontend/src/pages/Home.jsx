import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SongChange from "../components/SongChange"
import BottomNavigation from '../components/BottomNavigation';
import WordFrequencyChart from '../components/WordFrequencyChart';
import LoadingIndicator from "../components/LoadingIndicator";
import ensureAuth from "../utils/authUtils";
import styles from "../styles/Home.module.css";

function Home() {
    const [songs, setSongs] = useState([]);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [videoId, setVideoId] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [activeTab, setActiveTab] = useState("published"); // или "drafts"
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        getSongs();
    }, [activeTab]);

    const getSongs = async () => {
        setLoading(true);

        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        const publishedParam = activeTab === "published" ? "true" : "false";
        api
            .get(`/api/songs/?published=${publishedParam}`)
            .then((res) => res.data)
            .then((data) => {
                setSongs(data);
                console.log(data);
            })
            .catch((err) => alert(err))
            .finally(() => setLoading(false));
    };

    const togglePublished = async (id, value) => {
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        api
            .patch(`/api/songs/${id}/`, { is_published: value })
            .then(() => getSongs())
            .catch((err) => alert(err));
    };

    const editSong = async (id) => {
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        navigate(`/edit-song/${id}`)
    };

    const requestDeleteSong = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        api
            .delete(`/api/songs/delete/${confirmDeleteId}/`)
            .then((res) => {
                if (res.status === 204) alert("Песня удалена!");
                else alert("Не удалось удалить песню");
                getSongs();
            })
            .catch((error) => alert(error))
            .finally(() => setConfirmDeleteId(null));
    };
    
    const cancelDelete = () => {
        setConfirmDeleteId(null);
    };
    
    

    const createSong = async (e) => {
        const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

        e.preventDefault();
        api
            .post("/api/songs/", { title, artist, youtube_id: videoId })
            .then((res) => {
                if (res.status === 201) alert("Песня создана!");
                else alert("Не удалось создать песню");
                getSongs();
                setShowForm(false);
                setTitle("");
                setArtist("");
                setVideoId("");
            })
            .catch((err) => alert(err));
    };

    return (
        <div className={styles.pageContainer}>
            <button className={styles.chartButton} onClick={() => setShowChart(true)}>График</button>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tabButton} ${activeTab === "published" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("published")}
                >
                    Готовые
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === "drafts" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("drafts")}
                >
                    В работе
                </button>
            </div>



            {loading ? (
                <LoadingIndicator />
            ) : (
                <>
                    {songs.length > 0 ? (
                        <h2>Песни</h2>
                    ) : (
                        <h2>Песни отсутствуют</h2>
                    )}
                    <div className={styles.songsBlock}>
                        
                        {songs.map((song) => (
                            <SongChange
                                song={song}
                                onEdit={editSong}
                                onDelete={requestDeleteSong}
                                onTogglePublished={togglePublished}
                                key={song.id}
                                isDraft={activeTab === "drafts"}
                                openMenuId={openMenuId}
                                setOpenMenuId={setOpenMenuId}
                            />
                        ))}
                    </div>
                </>
            )}

            

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

            {confirmDeleteId !== null && (
                <div className={styles.overlay}>
                    <div className={styles.confirmBox}>
                        <p>Точно хотите удалить песню?</p>
                        <div className={styles.confirmButtons}>
                            <button onClick={confirmDelete} className={styles.confirmButton}>Да</button>
                            <button onClick={cancelDelete} className={styles.cancelButton}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            <button className={styles.fab} onClick={() => setShowForm(true)}>+</button>
            <BottomNavigation active="home" />
        </div>
    );
}

export default Home;
