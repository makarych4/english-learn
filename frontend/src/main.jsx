import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// инструменты для создания "data router"
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// основной компонент-макет
import App from './App.jsx';

// страницы и компоненты
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedRouteProfile from "./components/ProtectedRouteProfile";
import EditSong from "./pages/EditSong";
import ProtectedSongRoute from "./components/ProtectedSongRoute";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import SongLearn from "./pages/SongLearn";

// Navigate для служебных роутов
import { Navigate } from "react-router-dom";

// Вспомогательные компоненты-функции для выхода и регистрации
function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

// Создаем роутер с помощью createBrowserRouter
// Это способ определения маршрутов в виде объекта.
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App теперь наш корневой компонент-обертка (Layout)
    children: [ // Все дочерние роуты будут рендериться вместо <Outlet /> в App.jsx
      {
        index: true, // index: true означает, что этот роут соответствует пути "/"
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "register",
        element: <RegisterAndLogout />,
      },
      {
        path: "edit-song/:songId",
        element: (
          <ProtectedRoute>
            <EditSong />
          </ProtectedRoute>
        ),
      },
      {
        path: "search",
        element: <Search />,
      },
      {
        path: "song/:songId",
        element: <SongLearn />,
      },
      {
        path: "profile",
        element: (
          <ProtectedRouteProfile>
            <Profile />
          </ProtectedRouteProfile>
        ),
      },
      {
        path: "*", // Роут для всех остальных, ненайденных путей
        element: <NotFound />,
      },
    ],
  },
]);

const queryClient = new QueryClient()

// Рендерим приложение, передавая ему наш новый роутер
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);