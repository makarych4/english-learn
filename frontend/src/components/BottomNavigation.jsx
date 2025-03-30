import React from 'react';
import { Link } from 'react-router-dom';
import homeIcon from '../assets/home.svg';
import searchIcon from '../assets/search.svg';
import profileIcon from '../assets/profile.svg';
import styles from '../styles/BottomNavigation.module.css';

function BottomNavigation({ active }) {
  return (
    <nav className={styles.bottomNav}>
      <div className={styles.iconContainer}>
        <Link to="/" className={active === "home" ? styles.active: ""}>
          <img 
            src={homeIcon}
            alt="Home"
          />
          <span>Home</span>
        </Link>
        </div>

      <div className={styles.iconContainer}>
        <Link to="/search" className={active === "search" ? styles.active: ""}>
          <img 
            src={searchIcon}
            alt="Search"
          />
          <span>Search</span>
        </Link>
      </div>
      
      <div className={styles.iconContainer}>
        <Link to="/profile" className={active === "profile" ? styles.active: ""}>
          <img 
            src={profileIcon}
            alt="Profile"
          />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNavigation;