import styles from "../styles/EditSongLyricsLine.module.css"
import AnnotationPinIcon from "../assets/pin.svg";
import AutoResizeTextarea from "./AutoResizeTextarea";
function EditSongLyricsLine({ line, index, onChange, onAddLine, onDeleteLine, isAnnotationMode, isSelected, onSelect, onAnnotationClick, hoveredAnnotationId, onHoverAnnotation, isEditingAnnotationLines, selectedLineIds, editingAnnotationId }) {
// Определяем, кликабельна ли строка сейчас
const handleLineClick = () => {
        if (isAnnotationMode) {
            if (isEditingAnnotationLines) {
                // Разрешаем клик, если:
                // 1. Строка свободна (!line.annotation)
                // 2. ИЛИ строка принадлежит ТЕКУЩЕЙ редактируемой аннотации
                if (!line.annotation || line.annotation === editingAnnotationId) {
                    onSelect(line.id || line.tempId);
                }
            } else if (!line.annotation) {
                // В режиме создания аннотации — по-прежнему только строки без аннотаций
                onSelect(line.id || line.tempId);
            }
        }
    };
    

const handleMouseEnter = () => {
    // Если у строки есть аннотация, "сообщаем" родителю ее ID
    if (onHoverAnnotation) {
        onHoverAnnotation(line.annotation);
    }
};

const handleMouseLeave = () => {
    // Когда курсор уходит, "сообщаем" родителю, что ховера больше нет
    if (onHoverAnnotation) {
        onHoverAnnotation(null);
    }
};
const isSelectedForEdit = isEditingAnnotationLines && selectedLineIds.includes(line.id);
const isTouchDevice = typeof window !== "undefined" && 
                      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

const isClickable = isAnnotationMode && (
    (isEditingAnnotationLines && (!line.annotation || line.annotation === editingAnnotationId)) ||
    (!isEditingAnnotationLines && !line.annotation)
);

// --- ОПРЕДЕЛЯЕМ, НУЖНА ЛИ ПОДСВЕТКА ---
const isHighlighted = 
        // 1. Включен режим аннотаций
        isAnnotationMode && 
        // 2. У строки есть аннотация
        line.annotation && 
        // 3. ID аннотации совпадает с ID той, на которую навели курсор
        line.annotation === hoveredAnnotationId &&
        // 4. И эта аннотация - НЕ та, которую мы сейчас редактируем
        line.annotation !== editingAnnotationId;
return (
    <>
    <div 
        className={`
            ${styles.lineContainer} 
            ${isSelected ? styles.selected : ''} 
            ${isClickable ? styles.selectable : ''}
            ${isHighlighted ? styles.highlighted : ''} 
            ${isSelectedForEdit ? styles.selectedForEdit : ''}
        `}
        onClick={handleLineClick}
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
        <div className={styles.lineHeader}>
            <span className={styles.numberLine}>Строка {line.line_number}:</span>
            {/* Если у строки есть аннотация, показываем значок */}
            {line.annotation && (
                <img
                    src={AnnotationPinIcon}
                    alt="Аннотация"
                    className={styles.annotationPin}
                    onClick={() => onAnnotationClick(line.annotation)}
                />
            )}
            {!isAnnotationMode && (<button
                className={styles.deleteIcon}
                onClick={() => onDeleteLine(index)}
                aria-label="Удалить строку"
            >
                ✖
            </button>)}
        </div>

        {/* Оборачиваем оригинальную строку в div, чтобы сделать ее кликабельной */}
        <div>
            <AutoResizeTextarea
                className={styles.originalLine}
                value={line.original_line}
                onChange={(e) => onChange(index, "original_line", e.target.value)}
                placeholder="Оригинальная строка"
                disabled={isAnnotationMode} // Блокируем редактирование в режиме аннотаций 
            />
            <AutoResizeTextarea
                className={styles.translationLine}
                value={line.translated_line}
                onChange={(e) => onChange(index, "translated_line", e.target.value)}
                placeholder="Перевод"
                disabled={isAnnotationMode} // Блокируем редактирование в режиме аннотаций
            />
        </div>
    </div>
    <button
        className={styles.addButton}
        onClick={() => onAddLine(index + 1)}
        disabled={isAnnotationMode}
    >
        Добавить строку
    </button>
    </>
);
}
export default EditSongLyricsLine;