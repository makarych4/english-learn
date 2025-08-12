import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
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

    const validateUsername = (username) => {
        // Регулярное выражение, соответствующее Django: буквы, цифры и символы @/./+/-/_
        const regex = /^[\w.@+-]+$/;
        return regex.test(username);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {// || !email
            alert("Все поля должны быть заполнены");
            return;
        }

        if (!validateUsername(username)) {
            alert("Имя пользователя содержит недопустимые символы. Разрешены только латинские буквы, цифры и символы @/./+/-/_");
            return;
        }

        // if (!validateEmail(email)) {
        //     alert("Введите корректный email");
        //     return;
        // }

        setLoading(true);

        try {
            const response = await api.post(route, { username, email, password })
            if (response.status === 201) { // 201 - статус успешного создания ресурса
                alert("Вы успешно зарегистрировались!");
                navigate("/login");
            } else {
                alert("Ошибка при регистрации");
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                // Получаем объект с ошибками из ответа сервера
                const errorData = error.response.data;
                let errorMessages = [];

                // Проверяем, есть ли ошибка для поля 'username'
                if (errorData.username) {
                    // В DRF это массив, берем первое сообщение
                    errorMessages.push('Пользователь с таким именем уже существует.'); 
                }

                // Проверяем, есть ли ошибка для поля 'email'
                if (errorData.email) {
                    // Берем ваше кастомное сообщение
                    errorMessages.push(errorData.email[0]);
                }
                
                // Если после проверок у нас есть сообщения, показываем их
                if (errorMessages.length > 0) {
                    // Объединяем все сообщения в одну строку с переносами
                    alert(errorMessages.join('\n'));
                } else {
                    // Если ошибка 400, но это не username/email (например, пустой пароль)
                    alert("Ошибка валидации. Проверьте введенные данные.");
                }

            } else {
                // Для всех других ошибок (нет сети, сервер упал и т.д.)
                alert("Произошла ошибка. Пожалуйста, попробуйте снова.");
                console.error("Registration error:", error);
            }
        } finally {
            setLoading(false);
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
                {/* <input
                    className={styles.formInput}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Почта"
                /> */}
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
            <div className={styles.loadingBlock}>
                {loading && (<LoadingIndicator />)}
            </div>
            <BottomNavigation active="profile" />
        </div>
    );
}

export default Register