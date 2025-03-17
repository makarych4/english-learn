import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = "Регистрация";
    const route="/api/user/register/"

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            api.post(route, { username, email, password })
            navigate("/login")
        } catch (error) {
            alert(error)
        } finally {
            setLoading(false)
        }
    };

    return (
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
                type="Почта"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Почта"
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
            Есть аккаунт?
            <button className="register-button" type="button" onClick={() => navigate("/login")}>
                Войти
            </button>
        </form>
    );
}

export default Register