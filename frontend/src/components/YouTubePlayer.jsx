// Импортируем необходимые модули
import React, { useState } from 'react';
import YouTube from 'react-youtube';
import playIcon from '../assets/play.svg';
import styles from '../styles/YouTubePlayer.module.css';

const YouTubePlayer = ({ videoId }) => {
  // управление отображением плеера
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  // Настройки YouTube-плеера
  const opts = {
    playerVars: {
      autoplay: 1, // Автоматически воспроизводить видео при загрузке плеера
      rel: 0, // отключить похожие видео
    },
  };

  return (
    <div className={styles.container}> {/* Контейнер для плеера и кнопки */}
      {/* Если плеер не активирован, показываем кнопку "Play Video" */}
      {!isPlaying &&
        <button className={styles.playButton} onClick={handlePlay}>
          <img
            src={playIcon}
            alt="Play Video"
            className={styles.playIcon}
          />
        </button>
      }
      {/* Если isPlaying == true, отображаем YouTube-плеер */}
      {isPlaying &&
        <YouTube
          className={styles.videoWrapper}
          videoId={videoId}
          opts={opts}
        />}
    </div>
  );
};

export default YouTubePlayer;
