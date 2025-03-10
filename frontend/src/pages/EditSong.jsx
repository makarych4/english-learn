import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import SongLyricsLine from "../components/SongLyricsLine";

function EditSong() {
    const { songId } = useParams();
    const navigate = useNavigate();
    const [lyrics, setLyrics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLyrics();
    }, [songId]);

    const fetchLyrics = () => {
        api.get(`/api/songLyrics/?song_id=${songId}`)
            .then((res) => {
                setLyrics(res.data);
                setIsLoading(false);
            })
            .catch((err) => {
                alert(err);
                setIsLoading(false);
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
        // Обновляем line_number для всех строк
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

    const handleDeleteLine = (lineId) => {
        api.delete(`/api/songLyrics/${lineId}/`)
            .then(() => {
                fetchLyrics();
            })
            .catch((err) => alert(err));
    };

    const handleSave = () => {
        const savePromises = lyrics.map((line) => {
            if (line.id) {
                return api.put(`/api/songLyrics/${line.id}/`, line);
            } else {
                return api.post("/api/songLyrics/", line);
            }
        });

        Promise.all(savePromises)
            .then(() => {
                alert("Изменения сохранены!");
                navigate("/");
            })
            .catch((err) => alert(err));
    };

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

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