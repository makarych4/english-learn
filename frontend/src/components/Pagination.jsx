import React from 'react';
import ReactPaginate from 'react-paginate';
import styles from '../styles/Pagination.module.css';

const Pagination = ({ pageCount, onPageChange, currentPage }) => {
  return (
    <ReactPaginate
      previousLabel={'<'}
      nextLabel={'>'}
      breakLabel={'...'}
      pageCount={pageCount}
      marginPagesDisplayed={1} // Всегда показываем первую и последнюю страницы
      pageRangeDisplayed={1} // Вокруг текущей страницы показываем по 1 элементу с каждой стороны
      onPageChange={onPageChange}
      forcePage={currentPage - 1}
      containerClassName={styles.pagination}
      pageClassName={styles.pageItem}
      pageLinkClassName={styles.pageLink}
      previousClassName={styles.pageItem}
      previousLinkClassName={styles.pageLink}
      nextClassName={styles.pageItem}
      nextLinkClassName={styles.pageLink}
      breakClassName={styles.pageItem}
      breakLinkClassName={styles.breakLink}
      activeClassName={styles.active}
      disabledClassName={styles.disabled}
    />
  );
};

export default Pagination;