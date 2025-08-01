import React from 'react';
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.spinnerText}>{message}</p>
    </div>
  );
}
