import { useNavigate } from "react-router-dom";
import BottomNavigation from '../components/BottomNavigation';
import styles from "../styles/Profile.module.css";

function Profile() {
    const navigate = useNavigate();

    return (
        <div className={styles.pageContainer}>
            <button className={styles.logoutButton} type="button" onClick={() => navigate("/logout")}>
                Выйти
            </button>
            <BottomNavigation active="profile" />
        </div>
    );
}

export default Profile;
