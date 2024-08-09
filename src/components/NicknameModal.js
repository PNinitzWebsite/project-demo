import React, { useState } from 'react';

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
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="text-xl">Edit Nickname</h2>
        <input
          type="text"
          value={nickname}
          onChange={(e) => {
            if (e.target.value.length <= 20) {
              setNickname(e.target.value);
            }
          }}
          className="input my-5"
        />
        {errorMessage && <p className="error-text">{errorMessage}</p>}
        <div className=' space-x-2'>
          <button onClick={onClose} className="btn-gray">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-secondary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NicknameModal;
