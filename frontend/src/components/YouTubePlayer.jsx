// YouTubePlayer.jsx

import React, { useState, useRef } from 'react'; // 1. Импортируем useRef
import YouTube from 'react-youtube';
import playIcon from '../assets/play.svg';
import closeIcon from '../assets/close.svg';
import chevronIcon from '../assets/chevron.svg';
import styles from '../styles/YouTubePlayer.module.css';

const YouTubePlayer = ({ videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFixed, setIsFixed] = useState(true);
  
  // 2. Создаем ref для хранения экземпляра плеера
  const playerRef = useRef(null);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsFixed(true);

    // Если у нас уже есть ссылка на плеер (значит, это не первый запуск),
    // то мы явно даем ему команду играть.
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
    // Если playerRef.current еще null, значит, это самый первый запуск,
    // и опция `autoplay: 1` сработает сама после onReady.
  };

  const handleClose = () => {
    // 3. Теперь мы не только скрываем плеер, но и останавливаем видео
    if (playerRef.current) {
      playerRef.current.stopVideo(); // Команда для плеера остановиться
    }
    setIsPlaying(false); // Скрываем контейнер как и раньше
  };

  const toggleFixed = () => {
    setIsFixed(prev => !prev);
  };

  const opts = {
    playerVars: {
      //autoplay: 1,
      rel: 0,
    },
  };

  // 4. Функция, которая будет вызвана, когда плеер будет готов
  const onReady = (event) => {
    playerRef.current = event.target;
    // Когда плеер готов, мы проверяем, должен ли он играть.
    // Это сработает при самом первом запуске.
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  return (
    <div className={styles.container}>
      {/* Кнопка Play */}
      {!isPlaying && (
        <button className={styles.playButton} onClick={handlePlay}>
          <img src={playIcon} alt="Play Video" className={styles.playIcon} />
        </button>
      )}

      {/* Шеврон */}
      {isPlaying && (<button
        className={`
          ${styles.chevronButton} 
          ${isFixed ? styles.chevronFixed : styles.chevronUnfixed} 
          ${!isFixed ? styles.rotated : ''}
        `}
        onClick={toggleFixed}
      >
        <img src={chevronIcon} alt="Toggle" className={styles.chevronIcon} />
      </button>)}

      {/* Плеер */}
      <div
        className={`
          ${styles.videoContainer} 
          ${isFixed ? styles.fixed : ''} 
          ${!isPlaying ? styles.hidden : ''}
        `}
      >
        <button className={styles.closeButton} onClick={handleClose}>
          <img src={closeIcon} alt="Close" className={styles.closeIcon} />
        </button>
        {/* 5. Передаем onReady в компонент YouTube */}
        <YouTube
          className={`${styles.videoWrapper} ${!isFixed ? styles.collapsedVideo : ''}`}
          videoId={videoId}
          opts={opts}
          onReady={onReady} />
      </div> 
    </div>
  );
};

export default YouTubePlayer;