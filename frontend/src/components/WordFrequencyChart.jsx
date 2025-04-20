import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import api from "../api";
import Pagination from "./Pagination";
import styles from "../styles/WordFrequencyChart.module.css";

function WordFrequencyChart() {
    const [words, setWords] = useState("");
    const [customMode, setCustomMode] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(0);

    useEffect(() => {
        if (!customMode) {
            fetchTopWords(page);
        }
    }, [page, customMode]);

    const fetchTopWords = (pageNumber) => {
        api.get("/api/public/word-frequency/", { params: { page: pageNumber } })
            .then(res => {
                setData(res.data.results);
                setPageCount(Math.ceil(res.data.count / 10));
            })
            .catch(err => alert("Ошибка при загрузке частот слов"));
    };
    

    const fetchCustomWords = () => {
        const wordList = words.split(",").map(w => w.trim().toLowerCase()).filter(Boolean);
        if (wordList.length === 0) return;

        api.post("/api/public/word-frequency/custom/", { words: wordList })
            .then(res => setData(res.data))
            .catch(err => alert("Ошибка при обработке слов"));
    };

    const handleWordChange = (e) => {
        setWords(e.target.value);
    };

    const handleCustomSearch = () => {
        setCustomMode(true);
        fetchCustomWords();
    };

    const handleReset = () => {
        setWords("");
        setCustomMode(false);
        setPage(1);
    };

    const handlePageChange = (selected) => {
        setPage(selected.selected + 1);
    };
    

    return (
        <div className={styles.chartContainer}>
            <div className={styles.controls}>
                <input
                    type="text"
                    placeholder="Введите слова через запятую"
                    value={words}
                    onChange={handleWordChange}
                />
                <button onClick={handleCustomSearch} disabled={words.trim() === ""}>
                    Показать
                </button>
                {customMode && <button onClick={handleReset}>Сброс</button>}
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="word" width={80} tick={{ fontSize: 12 }} />
                    <Bar dataKey="frequency" fill="#6a5acd" />
                </BarChart>
            </ResponsiveContainer>

            {!customMode && (
                <Pagination
                    pageCount={pageCount}
                    currentPage={page}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}

export default WordFrequencyChart;
