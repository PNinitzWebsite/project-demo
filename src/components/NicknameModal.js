import React, { useState } from 'react';
import styles from './NicknameModal.module.css';

const NicknameModal = ({ show, onClose, onSave, initialNickname }) => {
  const [nickname, setNickname] = useState(initialNickname);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = () => {
    if (nickname === '') {
      setErrorMessage('กรุณากรอกชื่อเล่น');
    } else if (/^\d+$/.test(nickname)) {
      setErrorMessage('ชื่อเล่นไม่สามารถเป็นตัวเลขเท่านั้นได้');
    } else if (/[^a-zA-Z0-9ก-๙]/.test(nickname)) {
      setErrorMessage('ชื่อเล่นไม่สามารถมีอักขระพิเศษได้ (ยกเว้น a-z, A-Z, 0-9 และ ก-๙)');
    } else if (nickname.length > 20) {
      setErrorMessage('ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร');
    } else {
      onSave(nickname);
      onClose();
      setErrorMessage(''); // Clear error message on successful save
    }
  };
  
  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className="text-xl">Edit Nickname</h2>
        <p className={styles.currentNickname}>Current Nickname: {initialNickname}</p>
        <input
        type="search"
        value={nickname}
        onChange={(e) => {
            if (e.target.value.length <= 20) {
            setNickname(e.target.value);
            }
        }}
        className={styles.input}
        />

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        <div className={styles.buttons}>
          <button onClick={onClose} className={styles.buttonred}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.button}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NicknameModal;
