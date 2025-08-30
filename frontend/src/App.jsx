// src/App.jsx

// 1. Импортируем Outlet - это "место", куда роутер будет вставлять страницы
import { Outlet } from "react-router-dom"; 

// Импортируем глобальные стили
import "./styles/global.css";

// App теперь - это компонент-макет (Layout)
function App() {
  return (
    <>
      {/* 
        Здесь могла бы быть общая для всех страниц разметка,
        например, шапка сайта (<Header />).
        Outlet - это точка, в которой будет отображаться
        текущая страница (Home, Login, Search и т.д.).
      */}
      <Outlet />
    </>
  );
}

export default App;