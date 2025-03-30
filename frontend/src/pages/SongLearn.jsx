import React, { useState, useEffect } from "react";
import { href, useParams } from "react-router-dom";
import api from "../api";
import SongLyricsLine from "../components/SongLyricsLine";
import YouTubePlayer from "../components/YouTubePlayer";
import BottomNavigation from '../components/BottomNavigation';
import styles from '../styles/SongLearn.module.css';

function SongLearn() {
    const [lyrics, setLyrics] = useState([]);
    const { songId } = useParams();

    useEffect(() => {
        getLyrics();
    }, [songId]);

    const getLyrics = () => {
        api
            .get(`/api/songLyrics/public/${songId}/`)
            .then((res) => res.data)
            .then((data) => {
                setLyrics(data);
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    return (
        <>
            <h2>Текст песни</h2>
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
            <YouTubePlayer videoId="2g811Eo7K8U" />
            <BottomNavigation active="search" />
            
        </>
    );
}

export default SongLearn;
