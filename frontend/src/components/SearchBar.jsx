import { useState, useEffect } from "react";
import CustomPagination from "./Pagination";
import api from "../api";
import SongItem from "./SongItem";
import styles from "../styles/SearchBar.module.css";

function SearchBar() {
    const [songs, setSongs] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        if (query.trim().length === 0) {
            setSongs([]);
            setTotalPages(0);
            setPage(1)
            return;
        }

        const debounceTimeout = setTimeout(() => getSongs(page), 1000);
        return () => clearTimeout(debounceTimeout);
    }, [query, page]);

    const getSongs = (pageNumber) => {
        setLoading(true);
        api
            .get("/api/songs/public/", { params: { query, page: pageNumber } })
            .then((res) => {
                setSongs(res.data.results);
                setTotalPages(res.data.count ? Math.ceil(res.data.count / 10) : 0);
            })
            .catch((err) => alert(err))
            .finally(() => setLoading(false));
    };

    const handlePageClick = ({ selected }) => {
        setPage(selected + 1);
    };

    return (
        <div className={styles.searchBar}>
            <input
                className={styles.searchInput}
                value={query}
                type="search"
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск..."
            />
            <br />
            {loading && <p className={styles.loadingText}>Загрузка...</p>}
            <div className={styles.songItemContainer}>
                {songs.length > 0 ? songs.map(song => (
                    <SongItem key={song.id} song={song} />
                )) : <p className={styles.noResults}>Нет результатов</p>}
            </div>
            {totalPages > 1 && (
            <CustomPagination
                pageCount={totalPages}
                onPageChange={handlePageClick}
                currentPage={page}
            />
        )}
        </div>
    );
}

export default SearchBar;
