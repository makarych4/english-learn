import React, { useState } from 'react';
import YouTube from 'react-youtube';
import playIcon from '../assets/play.svg';
import closeIcon from '../assets/close.svg';
import styles from '../styles/YouTubePlayer.module.css';

const YouTubePlayer = ({ videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
  };

  const opts = {
    playerVars: {
      autoplay: 1,
      rel: 0,
    },
  };

  return (
    <div className={styles.container}>
      {!isPlaying &&
        <button className={styles.playButton} onClick={handlePlay}>
          <img src={playIcon} alt="Play Video" className={styles.playIcon} />
        </button>
      }

{isPlaying && (
  <div className={styles.videoContainer}>
    <button className={styles.closeButton} onClick={handleClose}>
      <img src={closeIcon} alt="Close" className={styles.closeIcon} />
    </button>
    <YouTube
      className={styles.videoWrapper}
      videoId={videoId}
      opts={opts}
    />
  </div>
)}
    </div>
  );
};

export default YouTubePlayer;
