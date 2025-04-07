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
    const [searchType, setSearchType] = useState('title_artist_search');
    const [artistGroup, setArtistGroup] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState("");
    const prevParamsRef = useRef({ query, page, searchType, artistGroup, selectedArtist });

    useEffect(() => {
        const isQueryChange = prevParamsRef.current.query !== query;
        prevParamsRef.current = { query, page, searchType, artistGroup, selectedArtist };

        if (query.trim().length === 0) {
            setSongs([]);
            setTotalPages(0);
            setPage(1);
            return;
        }

        let timeoutId;
        if (isQueryChange) {
            timeoutId = setTimeout(() => {
                setPage(1)
                getSongs(1);
            }, 1000);
        } else {
            getSongs(page);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [query, page, searchType, artistGroup, selectedArtist]);

    const handleSearchTypeChange = (e) => {
        setSearchType(e.target.value);
        setPage(1);
        if (query.trim().length !== 0) {
            setLoading(true);
        }
    };

    const handleArtistGroupToggle = () => {
        setArtistGroup(!artistGroup);
        setSelectedArtist("");
        setPage(1);
        setSongs([]);
        if (query.trim().length !== 0) {
            setLoading(true);
        }
    };

    const getSongs = (pageNumber) => {
        setLoading(true);
        api
            .get("/api/songs/public/", {
                params: {
                    query,
                    page: pageNumber,
                    search_type: searchType,
                    artist_group: artistGroup,
                    selected_artist: selectedArtist
                }
            })
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
                <label className={`${styles.searchModeTab} ${searchType === 'title_artist_search' ? styles.active : ''}`}>
                    <input
                        type="radio"
                        value="title_artist_search"
                        checked={searchType === 'title_artist_search'}
                        onChange={handleSearchTypeChange}
                    />
                    По автору/песне
                </label>
                <label className={`${styles.searchModeTab} ${searchType === 'lyrics_text_search' ? styles.active : ''}`}>
                    <input
                        type="radio"
                        value="lyrics_text_search"
                        checked={searchType === 'lyrics_text_search'}
                        onChange={handleSearchTypeChange}
                    />
                    По тексту
                </label>
            </div>
    
            <div className={styles.toggleSwitch}>
                <label className={styles.toggleLabel}>
                    Группировать по исполнителям
                    <input
                        type="checkbox"
                        checked={artistGroup}
                        onChange={handleArtistGroupToggle}
                    />
                    <span className={styles.toggleSlider} />
                </label>
            </div>

            {loading ? (
                <LoadingIndicator />
            ) : (
                <>
                    {artistGroup && !selectedArtist ? (
                        <div className={styles.artistList}>
                            {songs.map((item, index) => (
                                <p
                                    key={index}
                                    className={styles.artistItem}
                                    onClick={() => handleArtistClick(item.artist)}
                                >
                                    <span className={styles.artistLabel}>{item.artist} ({item.count})</span>
                                </p>
                            ))}
                            {songs.length === 0 && (
                                <p className={styles.noResults}>Нет результатов</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.songItemContainer}>
                            {selectedArtist && (
                                <button
                                    className={styles.backButton}
                                    onClick={handleBackClick}
                                >
                                    ←
                                </button>
                            )}
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

// import { useState, useEffect } from "react";
// import Pagination from "./Pagination";
// import api from "../api";
// import SongItem from "./SongItem";
// import styles from "../styles/SearchBar.module.css";

// function SearchBar() {
//     const [songs, setSongs] = useState([]);
//     const [query, setQuery] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [page, setPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(0);
//     const [searchType, setSearchType] = useState('title_artist_search');
//     const [artistGroup, setArtistGroup] = useState(false);
//     const [selectedArtist, setSelectedArtist] = useState("");

//     useEffect(() => {
//         if (query.trim().length === 0) {
//             setSongs([]);
//             setTotalPages(0);
//             setPage(1)
//             return;
//         }

//         const debounceTimeout = setTimeout(() => getSongs(page), 1000);
//         return () => clearTimeout(debounceTimeout);
//     }, [query, page, searchType, artistGroup, selectedArtist]);

//     const handleSearchTypeChange = (e) => {
//         setSearchType(e.target.value);
//         setPage(1);
//     };

//     const handleArtistGroupToggle = () => {
//         setArtistGroup(!artistGroup);
//         setSelectedArtist("");
//         setPage(1);
//         setSongs([]);
//     };

//     const getSongs = (pageNumber) => {
//         setLoading(true);
//         api
//             .get("/api/songs/public/", {
//                 params: {
//                     query,
//                     page: pageNumber,
//                     search_type: searchType,
//                     artist_group: artistGroup,
//                     selected_artist: selectedArtist
//                 }
//             })
//             .then((res) => {
//                 setSongs(res.data.results);
//                 setTotalPages(res.data.count ? Math.ceil(res.data.count / 10) : 0);
//             })
//             .catch((err) => alert(err))
//             .finally(() => setLoading(false));
//     };

//     const handlePageClick = ({ selected }) => {
//         setPage(selected + 1);
//     };

//     return (
//         <div className={styles.searchBar}>



//             {/* Переключатель поиска */}
//             <div className={styles.searchOptions}>
//                 <label>
//                     <input
//                         type="radio"
//                         value="lyrics_text_search"
//                         checked={searchType === 'lyrics_text_search'}
//                         onChange={handleSearchTypeChange}
//                     />
//                     Поиск по тексту
//                 </label>
//                 <label>
//                     <input
//                         type="radio"
//                         value="title_artist_search"
//                         checked={searchType === 'title_artist_search'}
//                         onChange={handleSearchTypeChange}
//                     />
//                     Поиск по исполнителю и названию
//                 </label>
//             </div>



//             <label>
//                 <input
//                     type="checkbox"
//                     checked={artistGroup}
//                     onChange={handleArtistGroupToggle}
//                 />
//                 Группировать по исполнителям
//             </label>



//             <input
//                 className={styles.searchInput}
//                 value={query}
//                 type="search"
//                 onChange={e => setQuery(e.target.value)}
//                 placeholder="Поиск..."
//             />
//             <br />



//             {loading ? (
//                 <p className={styles.loadingText}>Загрузка...</p>
//             ) : (
//                 <>
//                     {artistGroup && !selectedArtist ?
//                         (
//                             <div className={styles.artistList}>
//                                 {songs.map((item, index) => (
//                                     <p
//                                         key={index}
//                                         className={styles.artistItem}
//                                         onClick={() => setSelectedArtist(item.artist)}
//                                     >
//                                         {item.artist} ({item.count})
//                                     </p>
//                                 ))}
//                                 {songs.length === 0 && (
//                                     <p className={styles.noResults}>Нет результатов</p>
//                                 )}
//                             </div>
//                         ) : 
//                         (
//                             <div className={styles.songItemContainer}>
//                                 {selectedArtist && (
//                                     <button
//                                         className={styles.backButton}
//                                         onClick={() => setSelectedArtist("")}
//                                     >
//                                         ← Назад к списку исполнителей
//                                     </button>
//                                 )}
//                                 {songs.length > 0 ? (
//                                     songs.map(song => <SongItem key={song.id} song={song} />)
//                                 ) : (
//                                     <p className={styles.noResults}>Нeeeет результатов</p>
//                                 )}
//                             </div>
//                         )
//                     }
//                 </>
//             )}

//             {totalPages > 1 && (
//             <Pagination
//                 pageCount={totalPages}
//                 onPageChange={handlePageClick}
//                 currentPage={page}
//             />
//         )}
//         </div>
//     );
// }

// export default SearchBar;
