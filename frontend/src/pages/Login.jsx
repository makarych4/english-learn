import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import BottomNavigation from '../components/BottomNavigation';
//import "../styles/Form.css"

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
        <>
            <form onSubmit={handleSubmit} className="form-container">
                <h1>{name}</h1>
                <input
                    className="form-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Имя пользователя"
                />
                <input
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                />
                <button className="form-button" type="submit">
                    {name}
                </button>
            </form>
            <div className="form-switch-block">
                <p>Нет аккаунта?</p>
                <button className="register-button" type="button" onClick={() => navigate("/register")}>
                    Зарегистрироваться
                </button>
            </div>
            <BottomNavigation active="profile" />
        </>
    );
}

export default Login