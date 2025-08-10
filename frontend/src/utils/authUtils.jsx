import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

async function ensureAuth(navigate) {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);

    if (!accessToken || !refreshToken) {
        if (navigate) navigate("/login");
        return false;
    }

    try {
        const decoded = jwtDecode(accessToken);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
            const res = await api.post("/api/token/refresh/", { refresh: refreshToken });

            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                return true;
            } else {
                if (navigate) navigate("/login");
                return false;
            }
        }

        return true;
    } catch (error) {
        console.log("Auth error:", error);
        if (navigate) navigate("/login");
        return false;
    }
}

export async function checkOwnership(songId, navigate) {
    if (!songId) throw new Error("ID песни не указан");

    const isAuth = await ensureAuth(navigate);
        if (!isAuth) return;

    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) throw new Error("Токен доступа отсутствует");

    const response = await api.get(`/api/songs/${songId}/`);
    const song = response.data;

    const decoded = jwtDecode(token);
    const userId = decoded.user_id;

    return song.user === userId;
}

export default ensureAuth;