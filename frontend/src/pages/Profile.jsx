import { useNavigate } from "react-router-dom";
import BottomNavigation from '../components/BottomNavigation';

function Profile() {
    const navigate = useNavigate();

    return (
        <>
            <button className="logout-button" type="button" onClick={() => navigate("/logout")}>
                Выйти
            </button>
            <BottomNavigation active="profile" />
        </>
    );
}

export default Profile;
