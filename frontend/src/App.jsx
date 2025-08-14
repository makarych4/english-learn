import react from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import ProtectedRouteProfile from "./components/ProtectedRouteProfile"
import EditSong from "./pages/EditSong";
import ProtectedSongRoute from "./components/ProtectedSongRoute"
import Profile from "./pages/Profile"
import Search from "./pages/Search"
import SongLearn from "./pages/SongLearn"

import "./styles/global.css"


function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route
            path="/edit-song/:songId"
            element={
                <ProtectedRoute>
                  <ProtectedSongRoute>
                      <EditSong />
                  </ProtectedSongRoute>
                </ProtectedRoute>
            }
        />
        <Route
          path="/search"
          element={     
            <Search />
          }
        />
        <Route
          path="/song/:songId"
          element={     
            <SongLearn />
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRouteProfile>
              <Profile />
            </ProtectedRouteProfile>
          }
        />
        <Route path="*" element={<NotFound />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App