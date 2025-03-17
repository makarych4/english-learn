import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import SongLyricsLine from "../components/SongLyricsLine";

function EditSong() {
    const { songId } = useParams();
    const [lyrics, setLyrics] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getLyrics();
    }, [songId]);

    const getLyrics = () => {
        api
            .get(`/api/songLyrics/${songId}/`)
            .then((res) => {
                setLyrics(res.data);
            })
            .catch((err) => {
                alert(err);
            });
    };

    const handleAddLine = (index) => {
        const newLine = {
            original_line: "",
            translated_line: "",
            line_number: index + 1,
            song: songId,
        };
        const updatedLyrics = [...lyrics];
        updatedLyrics.splice(index, 0, newLine);
    
        // ПЕРЕСЧЕТ line_number
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

        // ПЕРЕСЧЕТ line_number
        updatedLyrics.forEach((line, idx) => {
            line.line_number = idx + 1;
        });

        setLyrics(updatedLyrics);
    };


    const handleSave = () => {
        // Удаляем все существующие строки
        api.delete(`/api/songLyrics/delete-all/${songId}/`)
            .then(() => {
                // Создаем новые строки
                const savePromises = lyrics.map((line) => {
                    return api.post("/api/songLyrics/", line);
                });
    
                Promise.all(savePromises)
                    .then(() => {
                        alert("Изменения сохранены!");
                        navigate("/");
                    })
                    .catch((err) => alert(err));
            })
            .catch((err) => alert(err));
    };

    return (
        <div>
            <h2>Редактирование текста песни</h2>
            <button onClick={() => handleAddLine(0)}>Добавить строку сверху</button>
            {lyrics.map((line, index) => (
                <SongLyricsLine
                    key={index}
                    line={line}
                    index={index}
                    onChange={handleChangeLine}
                    onAddLine={handleAddLine}
                    onDeleteLine={handleDeleteLine}
                />
            ))}
            <button onClick={handleSave}>Сохранить</button>
        </div>
    );
}

export default EditSong;