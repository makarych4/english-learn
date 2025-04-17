import React, { useEffect, useRef } from "react";
import styles from "../styles/SongChange.module.css";

function SongChange({ song, onDelete, onEdit, onTogglePublished, isDraft, openMenuId, setOpenMenuId }) {
    const isMenuOpen = openMenuId === song.id;
    const menuRef = useRef();

    const toggleMenu = (e) => {
        e.stopPropagation();
        setOpenMenuId(isMenuOpen ? null : song.id);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(song.id);
        setOpenMenuId(null);
    };

    const handleTogglePublished = (e) => {
        e.stopPropagation();
        onTogglePublished(song.id, !song.is_published);
        setOpenMenuId(null);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(song.id);
        setOpenMenuId(null);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    return (
        <div className={styles.songContainer}>
            <div className={styles.songHeader}>
                <p className={styles.songTitle}>{song.title}</p>
                <button className={styles.menuIcon} onClick={toggleMenu}>⋯</button>
            </div>
            <p className={styles.songArtist}>{song.artist}</p>

            {isMenuOpen && (
                <div ref={menuRef} className={styles.popupMenu}>
                    <button onClick={handleEdit}>Редактировать</button>
                    <button onClick={handleTogglePublished}>
                        {isDraft ? "Опубликовать" : "Снять с публикации"}
                    </button>
                    <button onClick={handleDelete}>Удалить</button>
                </div>
            )}
        </div>
    );
}

export default SongChange;