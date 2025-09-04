import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  // 1. Получаем доступ к объекту location
  const { pathname } = useLocation();

  // 2. Используем useEffect, который будет срабатывать
  //    каждый раз, когда меняется путь (pathname)
  useEffect(() => {
    // 3. Прокручиваем окно в самый верх
    window.scrollTo(0, 0);
  }, [pathname]); // Зависимость от pathname

  // 4. Этот компонент ничего не рендерит, он просто выполняет эффект
  return null;
}

export default ScrollToTop;