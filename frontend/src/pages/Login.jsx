import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import styles from "../styles/AuthForm.module.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = "Вход";
    const route="/api/token/"

    const validateUsername = (username) => {
        // Регулярное выражение, соответствующее Django: буквы, цифры и символы @/./+/-/_
        const regex = /^[\w.@+-]+$/;
        return regex.test(username);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            // Вы можете использовать alert, как и просили
            alert("Поля 'Имя пользователя' и 'Пароль' не должны быть пустыми.");
            
            // Или, что более современно, использовать тот же механизм ошибок, что и для сервера:
            // setErrorMessage("Все поля обязательны для заполнения.");
            
            return; // Прерываем выполнение функции, чтобы не отправлять запрос
        }

        if (!validateUsername(username)) {
            alert("Имя пользователя содержит недопустимые символы. Разрешены только буквы, цифры и символы @/./+/-/_");
            return;
        }

        setLoading(true);
        

        try {
            const res = await api.post(route, { username, password })
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/")
        } catch (error) {
            if (error.response && error.response.status === 401) {
                alert("Неправильный логин или пароль.");
            } else {
                // Для всех других ошибок (нет сети, сервер упал и т.д.)
                alert("Произошла ошибка. Пожалуйста, попробуйте снова.");
                console.error("Login error:", error); // Оставляем лог для отладки
            }
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
            <div className={styles.loadingBlock}>
                {loading && (<LoadingIndicator />)}
            </div>
            <BottomNavigation active="profile" />
        </div>
    );
}

export default Login