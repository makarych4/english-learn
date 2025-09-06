import { useRef, useEffect } from 'react';

function useScrollTrigger(stickyClass, dependencies = []) {
    const elementRef = useRef(null);

    useEffect(() => {
        const currentElement = elementRef.current;

        if (!currentElement) {
            console.warn("useScrollTrigger: Элемент для наблюдения не найден.");
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                const stuck = entry.intersectionRatio < 1;

                if (stuck) {
                    currentElement.classList.add(stickyClass);
                } else {
                    currentElement.classList.remove(stickyClass);
                }
            },
            {
                threshold: [1],
                rootMargin: '-1px 0px 0px 0px'
            }
        );

        observer.observe(currentElement);

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [stickyClass, ...dependencies]);

    return elementRef;
}

export default useScrollTrigger;