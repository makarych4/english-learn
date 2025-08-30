import styles from '../styles/SongLyricsLine.module.css';

function SongLyricsLine({ line, onAnnotationClick, hoveredAnnotationId, onHoverAnnotation }) {
    // Определяем, нужно ли подсвечивать
    const isAnnotated = !!line.annotation;
    const isHighlighted = isAnnotated && line.annotation === hoveredAnnotationId;
    
    const handleClick = () => {
        if (isAnnotated) {
            onAnnotationClick(line.annotation);
        }
    };

    const handleMouseEnter = () => {
        if (isAnnotated) {
            onHoverAnnotation(line.annotation);
        }
    };
    
    const handleMouseLeave = () => {
        onHoverAnnotation(null);
    };

    const isTouchDevice = typeof window !== "undefined" && 
                      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    return (
        <div 
            className={`
                ${styles.lineWrapper} 
                ${isAnnotated ? styles.annotated : ''} 
                ${isHighlighted ? styles.highlighted : ''}
            `}
            onClick={handleClick}
            {...(!isTouchDevice && { 
                onMouseEnter: handleMouseEnter, 
                onMouseLeave: handleMouseLeave 
            })}
            {...(isTouchDevice && { 
                onTouchStart: handleMouseEnter, 
                onTouchEnd: handleMouseLeave, 
                onTouchCancel: handleMouseLeave 
            })}
        >
            <p className={styles.originalLine}>
                {line.original_line}
            </p>
            
            <p className={styles.translatedLine}>
                {line.translated_line}
            </p>
        </div>
    );
}

export default SongLyricsLine;