import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import EditSongLyricsLine from "../components/EditSongLyricsLine";
//import "../styles/EditSong.css"

function EditSong() {
    const [lyrics, setLyrics] = useState([]);
    const { songId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        getLyrics();
    }, [songId]);

    const getLyrics = () => {
        api
            .get(`/api/songLyrics/${songId}/`)
            .then((res) => res.data)
            .then((data) => {
                setLyrics(data);
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    const handleAddLine = (index) => {
        const newLine = {
            original_line: "",
            translated_line: "",
            line_number: index + 1,
            song: songId,
        };
        const updatedLyrics = [...lyrics];
        // Вставка новой строки в массив
        updatedLyrics.splice(index, 0, newLine);
    
        // Пересчет в порядок 1, 2 , …, n
        updatedLyrics.forEach((line, idx) => {
            line.line_number = idx + 1;
        });
    
        setLyrics(updatedLyrics);
    };
    

    const handleChangeLine = (index, field, value) => {
        const updatedLyrics = [...lyrics];
        updatedLyrics[index][field] = value;
        setLyrics(updatedLyrics);
    };

    const handleDeleteLine = (index) => {
        const updatedLyrics = [...lyrics];
        updatedLyrics.splice(index, 1);

        // Пересчет в порядок 1, 2 , …, n
        updatedLyrics.forEach((line, idx) => {
            line.line_number = idx + 1;
        });

        setLyrics(updatedLyrics);
    };

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post("/api/token/refresh/", {
                refresh: refreshToken,
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access)
            } else {
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleSave = async () => {
        await refreshToken();

        try {
          await api.post(`/api/songLyrics/update/${songId}/`, lyrics);
          alert("Изменения сохранены!");
          navigate("/");
        } catch (err) {
          alert("Ошибка. Данные не изменены.");
        }
      };

    return (
        <>
            <h2>Редактирование текста песни</h2>
            <button className="add-button" onClick={() => handleAddLine(0)}>
                Добавить строку
            </button>
            {lyrics.map((line, index) => (
                <EditSongLyricsLine
                    line={line}
                    onChange={handleChangeLine}
                    onAddLine={handleAddLine}
                    onDeleteLine={handleDeleteLine}
                    index={index}
                    key={index}    
                />
            ))}
            <button className="save-button" onClick={handleSave}>
                Сохранить
            </button>
        </>
    );
}

export default EditSong;