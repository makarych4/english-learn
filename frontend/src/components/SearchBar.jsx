import { useState, useEffect, useRef } from "react";
import Pagination from "./Pagination";
import api from "../api";
import SongItem from "./SongItem";
import LoadingIndicator from "./LoadingIndicator";
import styles from "../styles/SearchBar.module.css";

function SearchBar() {
    const [songs, setSongs] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedArtist, setSelectedArtist] = useState("");
    const [viewMode, setViewMode] = useState("songs"); // "songs" или "artists"

    const prevParamsRef = useRef({ query, page, selectedArtist });

    useEffect(() => {
        const isQueryChange = prevParamsRef.current.query !== query;
        prevParamsRef.current = { query, page, selectedArtist };

        let timeoutId;

        if (viewMode === "songs") {
            if (isQueryChange) {
                timeoutId = setTimeout(() => {
                    setPage(1);
                    getSongs(1);
                }, 1000);
            } else {
                getSongs(page);
            }
        } else if (viewMode === "artists") {
            getSongs(page);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [query, page, selectedArtist, viewMode]);

    const handleViewModeChange = (viewType) => {
        setViewMode(viewType);
        setSelectedArtist("");
        setPage(1);
    };

    const getSongs = (pageNumber) => {
        setLoading(true);

        const trimmed = query.replaceAll(" ", "");
        const resolvedSearchType = trimmed.length === 0 ? "all_songs_search" : "reduce_songs_search";

        const params = {
            query,
            page: pageNumber,
            search_type: resolvedSearchType,
        };
    
        if (viewMode === "artists") {
            params.artist_group = true;
        }

        if (selectedArtist.trim()) {
            params.selected_artist = selectedArtist;
        }

        api
            .get("/api/songs/public/", { params })
            .then((res) => {
                setSongs(res.data.results);
                setTotalPages(res.data.count ? Math.ceil(res.data.count / 10) : 0);
            })
            .catch((err) => alert(err))
            .finally(() => setLoading(false));
    };

    const handlePageClick = ({ selected }) => {
        setPage(selected + 1);
        setLoading(true);
    };

    const handleArtistClick = (artist) => {
        setSelectedArtist(artist);
        setPage(1);
        setLoading(true);
    };

    const handleBackClick = () => {
        setSelectedArtist("");
        setPage(1);
        setLoading(true);
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

            {/* {selectedArtist && (
                <button
                    className={styles.backButton}
                    onClick={handleBackClick}
                >
                    ← Назад к исполнителям
                </button>
            )} */}

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
                            {songs.length === 0 && (
                                <p className={styles.noResults}>Нет результатов</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.songItemContainer}>
                            {songs.length > 0 ? (
                                songs.map(song => <SongItem key={song.id} song={song} />)
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
