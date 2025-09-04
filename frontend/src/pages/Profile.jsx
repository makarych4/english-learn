import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from "../api";
import BottomNavigation from '../components/BottomNavigation';
import LoadingIndicator from "../components/LoadingIndicator";
import styles from "../styles/Profile.module.css";

function Profile() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const queryKey = ['currentUser'];

    const fetchUserData = async ({ signal }) => {
        const { data } = await api.get("/api/user/", { signal });
        return data;
    };

    const { data: userData, isLoading, isError, error } = useQuery({
        queryKey: queryKey, 
        queryFn: fetchUserData,
        staleTime: Infinity,
        cacheTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });
    
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    const [newUsername, setNewUsername] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword1, setNewPassword1] = useState("");
    const [newPassword2, setNewPassword2] = useState("");
    
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        // Когда данные о пользователе загружены, обновляем поле для редактирования
        if (userData) {
            setNewUsername(userData.username);
        }
    }, [userData]);

    if (isError) {
        if (error.name !== 'CanceledError') {
             // Если ошибка авторизации, перенаправляем на логин
            if (error.response?.status === 401) {
                navigate('/login');
                return null;
            }
            alert("Не удалось загрузить данные профиля.");
        }
        return null;
    }

    const validateUsername = (username) => {
        const regex = /^[\w.@+-]+$/;
        return regex.test(username);
    };

    const handleUpdateUsername = (e) => {
        e.preventDefault();

        if (!validateUsername(newUsername)) {
            alert("Имя пользователя содержит недопустимые символы. Разрешены только латинские буквы, цифры и символы @/./+/-/_");
            return;
        }

        setUsernameLoading(true);
        // Используем PATCH на эндпоинт пользователя
        api.patch("/api/user/", { username: newUsername })
            .then(res => {
                alert("Имя пользователя успешно изменено!");
                queryClient.setQueryData(queryKey, (oldData) => ({
                    ...oldData,
                    username: res.data.username
                }));

                setIsEditingUsername(false);
            })
            .catch(err => {
                const errorMsg = err.response?.data?.username?.join(', ') || "Ошибка при смене имени.";
                alert(errorMsg);
            })
            .finally(() => setUsernameLoading(false));
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        api.post("/api/change-password/", {
            old_password: oldPassword,
            new_password1: newPassword1,
            new_password2: newPassword2,
        })
        .then(res => {
            alert("Пароль успешно изменен!");
            setIsChangingPassword(false);
            setOldPassword("");
            setNewPassword1("");
            setNewPassword2("");
        })
        .catch(err => {
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                let errorMessage = "Произошла ошибка:\n";
                for (const key in errorData) {
                    const messages = Array.isArray(errorData[key]) ? errorData[key].join(", ") : errorData[key];
                    errorMessage += `${messages}\n`;
                }
                alert(errorMessage.trim());
            } else {
                alert("Произошла неизвестная ошибка.");
            }
        })
        .finally(() => setPasswordLoading(false));
    };

    const handleLogout = () => {
        queryClient.removeQueries({ queryKey: queryKey });
        
        navigate("/logout");
    };

    return (
        <div className={styles.pageContainer}>
            {isLoading ? (
                <LoadingIndicator />
            ) : (
                <div className={styles.profileCard}>
                    <h1 className={styles.usernameTitle}>Профиль</h1>
                    
                    <div className={styles.infoBlock}>
                        <div className={styles.infoTextContainer}>
                            <span className={styles.infoLabel}>Имя пользователя:</span>
                            <strong className={styles.infoValue}>{userData?.username}</strong>
                        </div>
                        {/* Кнопка "Изменить" теперь просто переключатель */}
                        
                    </div>
                    {!isEditingUsername && (
                            <button className={styles.actionButton} onClick={() => setIsEditingUsername(true)}>
                                Изменить имя пользователя
                            </button>
                        )}
                    
                    {/* --- ФОРМА РЕДАКТИРОВАНИЯ ИМЕНИ --- */}
                    {isEditingUsername && (
                        <form onSubmit={handleUpdateUsername} className={styles.editForm}>
                            <h2 className={styles.formTitle}>Новое имя пользователя</h2>
                            <input
                                className={styles.inputField}
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                            <div className={styles.formActions}>
                                <button type="submit" className={styles.saveButton} disabled={usernameLoading}>
                                    {usernameLoading ? "Сохранение..." : "Сохранить имя"}
                                </button>
                                <button type="button" className={styles.cancelButton} onClick={() => setIsEditingUsername(false)}>
                                    Отмена
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- БЛОК СМЕНЫ ПАРОЛЯ --- */}
                    {!isChangingPassword && (
                        <button
                            className={styles.actionButton}
                            onClick={() => setIsChangingPassword(true)}
                        >
                            Сменить пароль
                        </button>
                    )}

                    {isChangingPassword && (
                        <form onSubmit={handleChangePassword} className={styles.passwordForm}>
                            <h2 className={styles.formTitle}>Смена пароля</h2>
                            <input
                                className={styles.inputField}
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Старый пароль"
                                required
                            />
                            <input
                                className={styles.inputField}
                                type="password"
                                value={newPassword1}
                                onChange={(e) => setNewPassword1(e.target.value)}
                                placeholder="Новый пароль"
                                required
                            />
                            <input
                                className={styles.inputField}
                                type="password"
                                value={newPassword2}
                                onChange={(e) => setNewPassword2(e.target.value)}
                                placeholder="Повторите новый пароль"
                                required
                            />
                            <div className={styles.formActions}>
                                <button type="submit" className={styles.saveButton} disabled={passwordLoading}>
                                    {passwordLoading ? "Сохранение..." : "Сохранить пароль"}
                                </button>
                                <button type="button" className={styles.cancelButton} onClick={() => setIsChangingPassword(false)}>
                                    Отмена
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <button className={styles.logoutButton} onClick={handleLogout}>
                Выйти
            </button>
            <BottomNavigation active="profile" />
        </div>
    );
}

export default Profile;