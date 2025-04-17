import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import BottomNavigation from '../components/BottomNavigation';
import styles from "../styles/AuthForm.module.css";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = "Регистрация";
    const route="/api/user/register/"

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!username || !email || !password) {
            alert("Все поля должны быть заполнены");
            return;
        }

        if (!validateEmail(email)) {
            alert("Введите корректный email");
            return;
        }

        try {
            const response = await api.post(route, { username, email, password })
            if (response.status === 201) { // 201 - статус успешного создания ресурса
                navigate("/login");
            } else {
                alert("Ошибка при регистрации");
            }
        } catch (error) {
            alert(error)
        } finally {
            setLoading(false)
        }
    };

    return (
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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Почта"
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
                <p>Есть аккаунт?</p>
                <button className={styles.switchButton} type="button" onClick={() => navigate("/login")}>
                    Войти
                </button>
            </div>
            <BottomNavigation active="profile" />
        </div>
    );
}

export default Register