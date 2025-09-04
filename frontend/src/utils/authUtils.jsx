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
        const gracePeriod = 10; 

        if (decoded.exp < now + gracePeriod) {
            console.log("Access token expired or expiring soon, refreshing...");
            const res = await api.post("/api/token/refresh/", { refresh: refreshToken });

            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                return true;
            } else {
                if (navigate) navigate("/logout");
                return false;
            }
        }

        return true;
    } catch (error) {
        console.log("Auth error:", error);
        localStorage.clear();
        if (navigate) navigate("/login");
        return false;
    }
}

export async function checkOwnership(songId, navigate) {
    if (!songId) throw new Error("ID песни не указан");

    const isAuth = await ensureAuth(navigate);
    if (!isAuth) return;

    try {
        const response = await api.get(`/api/song-ownership/${songId}/`);
        return response.data.is_owner;
    } catch (error) {
        console.error("Ошибка при проверке владения:", error);
        return false;
    }
}

export default ensureAuth;