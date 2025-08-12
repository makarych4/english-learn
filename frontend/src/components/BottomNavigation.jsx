import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import homeIcon from '../assets/home.svg';
import searchIcon from '../assets/search.svg';
import profileIcon from '../assets/profile.svg';

import styles from '../styles/BottomNavigation.module.css';

function BottomNavigation({ active }) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  // В useRef будем хранить предыдущие размеры окна
  const lastDimensions = useRef({ width: 0, height: 0 });

  useEffect(() => {
    // Инициализируем начальные размеры при первом рендере
    lastDimensions.current = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const lastWidth = lastDimensions.current.width;
      const lastHeight = lastDimensions.current.height;

      // Проверяем, изменилась ли ширина. Если да, то это поворот экрана или ресайз окна.
      // В этом случае мы НЕ считаем, что это клавиатура.
      if (currentWidth !== lastWidth) {
        setKeyboardVisible(false);
      } 
      // Если ширина НЕ изменилась, а высота значительно уменьшилась - это клавиатура!
      else if (currentHeight < lastHeight * 0.9) {
        setKeyboardVisible(true);
      }
      // Если высота вернулась к норме - клавиатура скрылась
      else if (currentHeight >= lastHeight * 0.9) {
        setKeyboardVisible(false);
      }
      
      // Обновляем последние известные размеры для следующего сравнения
      lastDimensions.current = {
        width: currentWidth,
        height: currentHeight
      };
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const navClassName = `${styles.bottomNav} ${isKeyboardVisible ? styles.hidden : ''}`;

  return (
    <nav className={navClassName}>
      <div className={styles.iconContainer}>
        <Link to="/" className={active === "home" ? styles.active : ""}>
          <img src={homeIcon} alt="Home" />
          <span>Home</span>
        </Link>
      </div>
      <div className={styles.iconContainer}>
        <Link to="/search" className={active === "search" ? styles.active : ""}>
          <img src={searchIcon} alt="Search" />
          <span>Search</span>
        </Link>
      </div>
      <div className={styles.iconContainer}>
        <Link to="/profile" className={active === "profile" ? styles.active : ""}>
          <img src={profileIcon} alt="Profile" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNavigation;