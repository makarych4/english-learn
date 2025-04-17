import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import BottomNavigation from '../components/BottomNavigation';
import styles from "../styles/AuthForm.module.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = "Вход";
    const route="/api/token/"

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await api.post(route, { username, password })
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/")
        } catch (error) {
            alert(error)
        } finally {
            setLoading(false)
        }
    };
    return(
        <div className={styles.pageContainer}>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <h1>{name}</h1>
                <input
                    className={styles.formInput}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Имя пользователя"
                />
                <input
                    className={styles.formInput}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                />
                <button className={styles.formButton} type="submit">
                    {name}
                </button>
            </form>
            <div className={styles.formSwitchBlock}>
                <p>Нет аккаунта?</p>
                <button className={styles.switchButton} type="button" onClick={() => navigate("/register")}>
                    Зарегистрироваться
                </button>
            </div>
            <BottomNavigation active="profile" />
        </div>
    );
}

export default Login