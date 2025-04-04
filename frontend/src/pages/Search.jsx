import BottomNavigation from '../components/BottomNavigation';
import SearchBar from "../components/SearchBar";

function Search() {
    
    return (
        <>
            <SearchBar/>
            <BottomNavigation active="search" />
        </>
    );
}

export default Search;
