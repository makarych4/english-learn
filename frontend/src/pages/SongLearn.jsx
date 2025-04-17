import React, { useState, useEffect } from "react";
import { href, useParams } from "react-router-dom";
import api from "../api";
import SongLyricsLine from "../components/SongLyricsLine";
import YouTubePlayer from "../components/YouTubePlayer";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import styles from '../styles/SongLearn.module.css';

function SongLearn() {
    const [lyrics, setLyrics] = useState([]);
    const [songData, setSongData] = useState("")
    const [loading, setLoading] = useState(false);
    const { songId } = useParams();

    useEffect(() => {
        getLyrics();
        getSongData();
    }, [songId]);

    const getLyrics = () => {
        setLoading(true);

        api
            .get(`/api/songLyrics/public/${songId}/`)
            .then((res) => res.data)
            .then((data) => {
                setLyrics(data);
                console.log(data);
            })
            .catch((err) => alert(err))
            .finally(() => setLoading(false));
    };

    const getSongData = () => {
        api
            .get(`/api/songs/public/${songId}/`)
            .then((res) => {
                setSongData(res.data);
            })
            .catch((err) => alert(err));
    };

    return (
        <div className={styles.pageContainer}>
            <h2 className={styles.h2text}>Текст песни</h2>
            {loading ? (
                <LoadingIndicator />
            ) : (
                <div className={styles.container}>
                    {lyrics.map((line, index) => (
                        <div>
                            <SongLyricsLine
                            line={line}
                            key={line.id}    
                        />
                            {index < lyrics.length - 1 && <hr/>}
                        </div>
                        
                    ))}
                </div>
            )}
            <YouTubePlayer videoId={songData.youtube_id} />
            <BottomNavigation active="search" />
            
        </div>
    );
}

export default SongLearn;
