import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import homeIcon from '../assets/home.svg';
import searchIcon from '../assets/search.svg';
import profileIcon from '../assets/profile.svg';
import styles from '../styles/BottomNavigation.module.css';
import { ACCESS_TOKEN } from "../constants";

function BottomNavigation({ active, onActiveClick }) {
  const [hasToken, setHasToken] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem(ACCESS_TOKEN)); // сразу определяем токен
  }, []);

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
      else if (currentHeight < lastHeight - 100) {
        setKeyboardVisible(true);
      }
      // Если высота вернулась к норме - клавиатура скрылась
      else if (currentHeight >= lastHeight + 100) {
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
    const params = new URLSearchParams(location.search);
    console.log(params);
    const viewMode = params.get("viewMode") || "songs";
    const page = parseInt(params.get("page") || "1", 10);
    const selectedArtist = params.get("selectedArtist");
    const selectedTitle = params.get("selectedTitle");
    console.log(selectedTitle);

    // 1. Проверяем, находимся ли мы уже на главной странице поиска
    if (location.pathname === '/search') {
      const isStandard =
      viewMode === "songs" &&
      page === 1 &&
      !selectedArtist &&
      !selectedTitle;
      // Если да, то отменяем переход и фокусируемся на инпуте
      if (isStandard) {
        e.preventDefault();
        const input = document.getElementById('mainSearchInput');
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input.focus();
        }
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
          to={hasToken ? "/" : "/search"}
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
          to={hasToken ? "/profile" : "/login"} 
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
