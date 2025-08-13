import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import homeIcon from '../assets/home.svg';
import searchIcon from '../assets/search.svg';
import profileIcon from '../assets/profile.svg';
import styles from '../styles/BottomNavigation.module.css';

function BottomNavigation({ active }) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const initialArea = useRef(0);

  useEffect(() => {
    if (window.visualViewport) {
      // Сохраняем начальную площадь
      initialArea.current =
        window.visualViewport.width * window.visualViewport.height;

      const handleResize = () => {
        const currentArea =
          window.visualViewport.width * window.visualViewport.height;

        // Проверка на 70%
        setKeyboardVisible(currentArea < initialArea.current * 0.7);
      };

      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);

      return () => {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      };
    }
  }, []);

  useEffect(() => {
    if (isKeyboardVisible) {
      document.body.classList.add('page-padding');
    } else {
      document.body.classList.remove('page-padding');
    }
  }, [isKeyboardVisible]);

  const navClassName = `${styles.bottomNav} ${isKeyboardVisible ? styles.hidden : ''}`;

  return (
    <nav className={navClassName}>
      <div className={styles.iconContainer}>
        <Link to="/" className={active === 'home' ? styles.active : ''}>
          <img src={homeIcon} alt="Home" />
          <span>Home</span>
        </Link>
      </div>
      <div className={styles.iconContainer}>
        <Link to="/search" className={active === 'search' ? styles.active : ''}>
          <img src={searchIcon} alt="Search" />
          <span>Search</span>
        </Link>
      </div>
      <div className={styles.iconContainer}>
        <Link to="/profile" className={active === 'profile' ? styles.active : ''}>
          <img src={profileIcon} alt="Profile" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNavigation;
