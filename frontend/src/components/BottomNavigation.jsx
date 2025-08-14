import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import homeIcon from '../assets/home.svg';
import searchIcon from '../assets/search.svg';
import profileIcon from '../assets/profile.svg';
import styles from '../styles/BottomNavigation.module.css';

function BottomNavigation({ active, onActiveClick }) {
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

  const location = useLocation();
  const handleLinkClick = (e, tabName, destinationPath) => {
    // Особое действие выполняется, только если:
    // 1. Вкладка активна (active === tabName)
    // 2. Передан специальный обработчик (onActiveClick)
    // 3. Мы находимся ТОЧНО на той странице, куда ведет ссылка (location.pathname === destinationPath)
    if (active === tabName && onActiveClick && location.pathname === destinationPath) {
      e.preventDefault(); // Предотвращаем бесполезный переход
      onActiveClick(tabName); // Вызываем особое действие (фокус на инпуте)
    }
    // Во ВСЕХ ОСТАЛЬНЫХ случаях Link будет работать как обычная ссылка.
    // Если мы на /song/123, location.pathname НЕ РАВЕН '/search',
    // поэтому `if` не сработает, и Link переведет нас на /search.
  };

  const handleSearchClick = (e) => {
    // 1. Проверяем, находимся ли мы уже на главной странице поиска
    if (location.pathname === '/search') {
      // Если да, то отменяем переход и фокусируемся на инпуте
      e.preventDefault();
      const input = document.getElementById('mainSearchInput');
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
      }
    }
    // 2. Если мы на ЛЮБОЙ другой странице (например, /song/123),
    // то этот `if` не сработает, `e.preventDefault()` не вызовется,
    // и <Link to="/search"> просто выполнит свою работу - перейдет на /search.
  };

  return (
    <nav className={navClassName}>
      <div className={styles.iconContainer}>
        <Link 
          to="/" 
          className={active === 'home' ? styles.active : ''}
          onClick={(e) => handleLinkClick(e, 'home', '/')}
        >
          <img src={homeIcon} alt="Home" />
          <span>Главная</span>
        </Link>
      </div>
      <div className={styles.iconContainer}>
        {/* Передаем путь назначения в обработчик */}
        <Link 
          to="/search" 
          className={active === 'search' ? styles.active : ''}
          onClick={handleSearchClick}
        >
          <img src={searchIcon} alt="Search" />
          <span>Поиск</span>
        </Link>
      </div>
      <div className={styles.iconContainer}>
        <Link 
          to="/profile" 
          className={active === 'profile' ? styles.active : ''}
          onClick={(e) => handleLinkClick(e, 'profile', '/profile')}
        >
          <img src={profileIcon} alt="Profile" />
          <span>Профиль</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNavigation;
