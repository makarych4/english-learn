import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Song from "../components/Song"
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
