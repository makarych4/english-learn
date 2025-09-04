import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";
import api from "../api";
import SongItem from "./SongItem";
import LoadingIndicator from "./LoadingIndicator";
import styles from "../styles/SearchBar.module.css";
import CloseIcon from "../assets/close2.svg";

function SearchBar() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Читаем все параметры из URL. Если их нет, ставим значения по умолчанию.
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const viewMode = searchParams.get("viewMode") || "songs";
    const selectedArtist = searchParams.get("selectedArtist") || "";
    const selectedTitle = searchParams.get("selectedTitle") || "";

    // Отдельный стейт для поля ввода, чтобы не менять URL на каждое нажатие
    const [inputValue, setInputValue] = useState(query);

    const isTouchDevice = typeof window !== "undefined" && 
                      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // запускается КАЖДЫЙ РАЗ, когда меняется URL (searchParams)
    const fetchSongs = async ({ signal }) => {
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

        // Передаем signal дальше в axios для автоматической отмены
        const { data } = await api.get("/api/songs/public/", { params, signal });
        return data;
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['songs', 'public', { query, page, viewMode, selectedArtist, selectedTitle }],
        queryFn: fetchSongs,
        staleTime: 10 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    // Эффект для задержки поиска
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Если значение в инпуте отличается от того, что в URL, обновляем URL
            if (inputValue !== query) {
                const trimmed = inputValue.trim();

                if (trimmed && selectedArtist && selectedTitle) {
                    // Если есть текст в запросе — сбрасываем выбранного артиста и песню
                    updateSearchParams({
                        query: inputValue,
                        page: 1,
                        selectedArtist: null,
                        selectedTitle: null,
                    });
                } else {
                    // Если запрос пустой — просто обновляем query
                    updateSearchParams({
                        query: inputValue,
                        page: 1,
                    });
                }
            }
        }, 600); // Задержка 600мс

        return () => clearTimeout(timeoutId);
    }, [inputValue]);

    // useEffect для синхронизации инпута с URL
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

    const handleClearInput = () => {
        setInputValue("");
    };

    const songs = data?.results || [];
    const totalPages = data?.count ? Math.ceil(data.count / 10) : 0;
    
    if (isError) {
        // Проверяем, что ошибка не из-за отмены запроса
        if (error.name !== 'CanceledError') {
             return <span>Произошла ошибка: {error.message}</span>;
        }
    }

    return (
        <div className={styles.searchBar}>
            <div className={styles.inputContainer}>
                <input
                    id="mainSearchInput"
                    className={styles.searchInput}
                    value={inputValue}
                    type="search"
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Поиск..."
                />
                {inputValue && (
                    <img
                        src={CloseIcon}
                        className={styles.clearIcon}
                        onClick={handleClearInput}
                        alt="Очистить поиск"
                    />
                )}
            </div>
    
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

            {selectedArtist && !selectedTitle && (
                <div className={styles.songHint}>
                    <p className={styles.selectedArtistWithout}>
                        {selectedArtist}
                    </p>
                </div>
            )}

            {selectedArtist && selectedTitle && (
                <div className={styles.songHint}>
                    <p className={styles.selectedTitle}>
                        {selectedTitle}
                    </p>
                    <p className={styles.selectedArtist}>
                        {selectedArtist}
                    </p>
                </div>
            )}

            {isLoading ? (
                <LoadingIndicator />
            ) : (
                <>
                    {viewMode === "artists" && !selectedArtist ? (
                        <div className={styles.artistList}>
                            {songs.map((item, index) => (
                                <p
                                    key={index}

                                    onClick={() => handleArtistClick(item.artist)}
                                    className={`${styles.artistItem}`}
                                                {...(isTouchDevice && {
                                                onTouchStart: (e) => e.currentTarget.classList.add(styles.touchActive),
                                                onTouchEnd: (e) => e.currentTarget.classList.remove(styles.touchActive),
                                                onTouchCancel: (e) => e.currentTarget.classList.remove(styles.touchActive),
                                                })}
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
                                    <SongItem
                                        key={song.id || `${song.artist}-${song.title}`}
                                        song={song}
                                        onClick={song.count ? handleSongGroupClick : null}
                                        activeTab="search"
                                    />
                                ))
                            ) : (
                                <p className={styles.noResults}>Нeт результатов</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {(totalPages > 1 && !isLoading)  && (
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