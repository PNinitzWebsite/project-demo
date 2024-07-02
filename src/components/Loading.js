// components/Loading.js

import React from 'react';
import styles from './Loading.module.css'; // Import CSS module for styles

const Loading = () => {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>กรุณารอสักครู่...</p>
    </div>
  );
};

export default Loading;
