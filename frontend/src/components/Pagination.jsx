import React from 'react';
import ReactPaginate from 'react-paginate';
import styles from '../styles/Pagination.module.css';

const CustomPagination = ({ pageCount, onPageChange, currentPage }) => {
  return (
    <ReactPaginate
      previousLabel={'<'}
      nextLabel={'>'}
      breakLabel={'...'}
      pageCount={pageCount}
      marginPagesDisplayed={2}
      pageRangeDisplayed={3}
      onPageChange={onPageChange}
      forcePage={currentPage - 1} // Добавляем текущую страницу
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

export default CustomPagination;