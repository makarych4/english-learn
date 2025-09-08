import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";
import LoadingIndicator from "./LoadingIndicator";
import BottomNavigation from './BottomNavigation';


function ProtectedRoute({ children }) {
     const token = localStorage.getItem(ACCESS_TOKEN);

    if (!token) {
        return <Navigate to="/login" />;
    }
    
    return children;
}

export default ProtectedRoute;