import BottomNavigation from '../components/BottomNavigation';
import SearchBar from "../components/SearchBar";
import styles from "../styles/Search.module.css";

function Search() {
    
    return (
        <div className={styles.pageContainer}>
            <SearchBar/>
            <BottomNavigation active="search" />
        </div>
    );
}

export default Search;
