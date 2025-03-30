import { useState, useEffect } from "react";
import api from "../api";
import SongItem from "./SongItem";

function SearchBar(){
    const [songs, setSongs] = useState([])
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const isQueryEmpty = query.trim().length === 0;

        if (isQueryEmpty) {
            setSongs([]);
            return;
        }

        const debounceTimeout = setTimeout(getSongs, 1000);

        return () => clearTimeout(debounceTimeout);
    }, [query]);

    const getSongs = () => {
        setLoading(true);
        api
            .get("/api/songs/public/", { params: { query } })
            .then((res) => res.data)
            .then((data) => {
                setSongs(data);
                console.log(data);
            })
            .catch((err) => alert(err))
            .finally(() => {
                setLoading(false);
            });
    };

    return (
    <>
        Найти:
        <input
            value={query}
            type="search"
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по названию или исполнителю..."
        />
        <br />
        {loading && <p>Загрузка...</p>}
        <div>
            {songs.map(song => (
                <SongItem
                    key={song.id}
                    song={song}
                />
            ))}
        </div>
    </>
    );
};

export default SearchBar;

// import { useState, useEffect } from "react";
// import api from "../api";
// import SongItem from "./SongItem";

// function SearchBar(){
//     const [songs, setSongs] = useState([])
//     const [query, setQuery] = useState("")
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         if (query.trim().length === 0) {
//             setSongs([]); // Очищаем список при пустом вводе
//             return;
//         }

//         const delayDebounceFn = setTimeout(() => {
//             getSongs();
//         }, 500); // Задержка 500мс перед выполнением запроса

//         return () => clearTimeout(delayDebounceFn); // Очистка таймера при каждом изменении query
//     }, [query]);

//     const getSongs = () => {
//         setLoading(true);
//         api
//             .get("/api/songs/public/")
//             .then((res) => res.data)
//             .then((data) => {
//                 setSongs(data);
//                 console.log(data);
//             })
//             .catch((err) => alert(err))
//             .finally(() => {
//                 setLoading(false);
//             });
//     };

//     const filteredSongs = songs.filter(song => {
//         const searchTerm = query.toLowerCase();
//         return (
//             song.title.toLowerCase().includes(searchTerm) ||
//             song.artist.toLowerCase().includes(searchTerm)
//         );
//     });

//     return (
//     <>
//         Найти:
//         <input
//             value={query}
//             type="search"
//             onChange={e => setQuery(e.target.value)}
//             placeholder="Поиск по названию или исполнителю..."
//         />
//         <br />
//         {loading && <p>Загрузка...</p>}
//         <div>
//             {filteredSongs.map(song => (
//                 <SongItem
//                     key={song.id}
//                     song={song}
//                 />
//             ))}
//         </div>
//     </>
//     );
// };

// export default SearchBar;