import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Главный инструмент
import Pagination from "./Pagination";
import api from "../api";
import SongChange from "./SongChange";
import LoadingIndicator from "./LoadingIndicator";
import styles from "../styles/SearchBar.module.css";

function SearchBar() {
    const [searchParams, setSearchParams] = useSearchParams();

    // --- ШАГ 1: URL - единственный источник правды ---
    // Читаем все параметры из URL. Если их нет, ставим значения по умолчанию.
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const viewMode = searchParams.get("viewMode") || "songs";
    const selectedArtist = searchParams.get("selectedArtist") || "";
    const selectedTitle = searchParams.get("selectedTitle") || "";

    // --- ШАГ 2: Локальное состояние, не попадающее в URL ---
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    // Отдельный стейт для поля ввода, чтобы не менять URL на каждое нажатие
    const [inputValue, setInputValue] = useState(query);

    // --- ШАГ 3: Обновленный useEffect для получения данных ---
    // Этот эффект запускается КАЖДЫЙ РАЗ, когда меняется URL (searchParams)
    useEffect(() => {
        const getSongs = () => {
            setLoading(true);
            const trimmed = query.replaceAll(" ", "");
            const resolvedSearchType = trimmed.length === 0 ? "all_songs_search" : "reduce_songs_search";
            
            const params = {
                query,
                page,
                search_type: resolvedSearchType,
            };
            if (viewMode === "artists") params.artist_group = true;
            if (selectedArtist) params.selected_artist = selectedArtist;
            if (selectedTitle) params.selected_title = selectedTitle;

            api.get("/api/songs/", { params })
                .then((res) => {
                    console.log("Ответ от сервера:", res);
                    setSongs(res.data.results);
                    setTotalPages(res.data.count ? Math.ceil(res.data.count / 10) : 0);
                })
                .catch((err) => alert(err))
                .finally(() => setLoading(false));
        };

        getSongs();
    }, [searchParams]); // Зависимость только от searchParams!

    // --- ШАГ 4: Эффект для задержки поиска (Debouncing) ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Если значение в инпуте отличается от того, что в URL, обновляем URL
            if (inputValue !== query) {
                updateSearchParams({ query: inputValue, page: 1 });
            }
        }, 800); // Задержка 800мс

        return () => clearTimeout(timeoutId);
    }, [inputValue]);

     useEffect(() => {
        // Если значение в URL (query) не совпадает со значением в инпуте,
        // обновляем инпут, чтобы он отражал URL.
        if (query !== inputValue) {
            setInputValue(query);
        }
    }, [query]);


    // --- ШАГ 5: Хелпер для удобного обновления URL ---
    const updateSearchParams = (newParams) => {
        // Создаем копию текущих параметров
        const currentParams = new URLSearchParams(searchParams);
        // Устанавливаем или удаляем новые параметры
        for (const [key, value] of Object.entries(newParams)) {
            if (value) {
                currentParams.set(key, value);
            } else {
                currentParams.delete(key);
            }
        }
        setSearchParams(currentParams);
    };


    // --- ШАГ 6: Обновленные обработчики событий ---
    // Все они теперь вызывают updateSearchParams, чтобы изменить URL

    const handleViewModeChange = (newViewMode) => {
        updateSearchParams({
            viewMode: newViewMode,
            page: 1,
            selectedArtist: null, // Удаляем параметры
            selectedTitle: null,
        });
    };

    const handlePageClick = ({ selected }) => {
        updateSearchParams({ page: selected + 1 });
    };

    const handleArtistClick = (artist) => {
        updateSearchParams({
            selectedArtist: artist,
            page: 1,
            selectedTitle: null, // Сбрасываем title при выборе артиста
        });
    };

    const handleSongGroupClick = (song) => {
        // Эта функция используется только для групп с несколькими версиями
        updateSearchParams({
            selectedArtist: song.artist,
            selectedTitle: song.title,
            page: 1,
        });
    };

    return (
        <div className={styles.searchBar}>
            <input
                className={styles.searchInput}
                value={inputValue}
                type="search"
                onChange={e => setInputValue(e.target.value)}
                placeholder="Поиск..."
            />
    
            <div className={styles.searchModeTabs}>
                <label
                    className={`${styles.searchModeTab} ${viewMode === "songs" ? styles.active : ""}`}
                    onClick={() => handleViewModeChange("songs")}
                >
                    Песни
                </label>
                <label
                    className={`${styles.searchModeTab} ${viewMode === "artists" ? styles.active : ""}`}
                    onClick={() => handleViewModeChange("artists")}
                >
                    Исполнители
                </label>
            </div>

            {!loading && selectedArtist && !selectedTitle && (
                <div className={styles.songHint}>
                    <p className={styles.selectedArtistWithout}>
                        {selectedArtist}
                    </p>
                </div>
            )}

            {!loading && selectedArtist && selectedTitle && (
                <div className={styles.songHint}>
                    <p className={styles.selectedTitle}>
                        {selectedTitle}
                    </p>
                    <p className={styles.selectedArtist}>
                        {selectedArtist}
                    </p>
                </div>
            )}

            {loading ? (
                <LoadingIndicator />
            ) : (
                <>
                    {viewMode === "artists" && !selectedArtist ? (
                        <div className={styles.artistList}>
                            {songs.map((item, index) => (
                                <p
                                    key={index}
                                    className={styles.artistItem}
                                    onClick={() => handleArtistClick(item.artist)}
                                >
                                    <span className={styles.artistLabel}>{item.artist}</span>
                                    <span className={styles.artistCount}>{item.count}</span>
                                </p>
                            ))}
                            {songs.length === 0 && <p className={styles.noResults}>Нет результатов</p>}
                        </div>
                    ) : (
                        <div className={styles.songItemContainer}>
                            {songs.length > 0 ? (
                                songs.map(song => (
                                    <SongChange
                                        key={song.id || `${song.artist}-${song.title}`}
                                        song={song}
                                        onClick={song.count ? handleSongGroupClick : null}
                                    />
                                ))
                            ) : (
                                <p className={styles.noResults}>Нeт результатов</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {(totalPages > 1 && !loading)  && (
                <Pagination
                    pageCount={totalPages}
                    onPageChange={handlePageClick}
                    currentPage={page}
                />
            )}
        </div>
    );
}

export default SearchBar;