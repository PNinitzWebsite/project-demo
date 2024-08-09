import { useRouter } from 'next/router';
import React, { useEffect, useState,useCallback } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout';
import { getCookie } from 'cookies-next';
import NicknameModal from '@/components/NicknameModal';
import Loading from '@/components/Loading'; // นำเข้า component Loading
import clientPromise from '../../lib/mongodb';
import Modal from 'react-modal';


// ตั้งค่าการใช้ modal ในแอป
Modal.setAppElement('#__next');

const Room = ({ email ,users, initialQuestions,rooms }) => {
  const router = useRouter();
  const { id } = router.query;
  const [room, setRoom] = useState(null);
  const [host, setHost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [profileNumber, setProfileNumber] = useState(null);
  const [loading, setLoading] = useState(true); // เพิ่ม state เพื่อเก็บสถานะการโหลด

  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");
  const [categoryQuestions, setCategoryQuestions] = useState('');
  const [nameQuestions, setNameQuestions] = useState('');
  const [detelQuestions, setDetelQuestions] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
  const [isEditRoomNameModalOpen, setIsEditRoomNameModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [file, setFile] = useState(null);
  const [isValidFile, setIsValidFile] = useState(true);

  const [questions, setQuestions] = useState(initialQuestions);
  const hasQuestions = Array.isArray(questions) ? questions.length > 0 : Object.keys(questions).length > 0;
  const [newCategory, setNewCategory] = useState('');
  const [isMovingCategory, setIsMovingCategory] = useState(false);
  const [isModalOpenRemoveUser, setIsModalOpenRemoveUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  // Handle file drop event
  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".py")) {
      setFile(droppedFile);
      setIsValidFile(true);
    } else {
      setFile(null);
      setIsValidFile(false);
      alert("Please upload a .py file");
    }
  };

  // Handle file drag over event
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Handle file input change event
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".py")) {
      setFile(selectedFile);
      setIsValidFile(true);
    } else {
      setFile(null);
      setIsValidFile(false);
      alert("Please upload a .py file");
    }
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    if (isValidFile && file) {
      uploadPython(file);
    } else {
      alert("Please upload a valid .py file.");
    }
  };
  // Trigger file input dialog programmatically
  const triggerFileInput = () => {
    document.getElementById('file').click();
  };

  const handleOpenModalRemoveUser = () => {
    setIsModalOpenRemoveUser(true);
  };
  
  const handleCloseModalRemoveUser = () => {
    setIsModalOpenRemoveUser(false);
  };

  const removeUserFromRoom = async () => {
    try {
      const response = await fetch('/api/remove-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomNumber:id, userEmail: selectedUser }),
      });
  
      if (response.ok) {
        alert(`ผู้ใช้ ${selectedUser} ถูกลบออกจากห้อง ${id} เรียบร้อยแล้ว`);
        fetchRoomData(); // Refresh the data after removing the user
        handleCloseModalRemoveUser();
      } else {
        console.error('Failed to remove user from room');
      }
    } catch (error) {
      console.error('Error removing user from room:', error);
    }
  };
  
  const fetchRoomData = useCallback(async () => {
    try {
      if (!id) return;

      const res = await fetch(`/api/room/${id}`);
      if (res.status === 404) {
        throw new Error('ไม่พบห้องที่คุณกำลังมองหา');
      }
      if (!res.ok) {
        throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง');
      }

      const data = await res.json();
      const { room } = data;

      setRoom(room);

      if (email === room.userHost) {
        setHost('host');
      } else {
        setHost('client');
        const index = room.users.findIndex(user => user === email);
        setProfileNumber(index + 1);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      alert(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, [id, email]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  const openEditRoomNameModal = () => {
    setIsEditRoomNameModalOpen(true);
  };
  
  const closeEditRoomNameModal = () => {
    setIsEditRoomNameModalOpen(false);
    setNewRoomName('');
  };
  
  const handleRoomNameChange = (e) => {
    setNewRoomName(e.target.value);
  };

  const saveNewRoomName = async () => {
    try {
      const response = await fetch('/api/room/updateRoomName', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomNumber: id, newRoomName }),
      });
  
      if (response.ok) {
        // Update the roomName state or re-fetch data as needed
        console.log('Room name updated successfully');
        // You might want to update your local state here
        window.location.reload();
      } else {
        console.error('Failed to update room name');
      }
    } catch (error) {
      console.error('Error updating room name:', error);
    } finally {
      closeEditRoomNameModal();
    }
  };
  

  const openModal = (exam) => {
    setSelectedExam(exam);
    setModalIsOpen(true);
  };
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedExam("");
  };
  const startExam = () => {
    closeModal();
    router.push(`${id}/exam/${selectedExam.exam}`);
  };

  const checkExam = () => {
    router.push(`${id}/exam/check-exam`);
  };

  const uploadPython = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const extractedData = parseFileContent(content);
  
      // Get the next exam number
      const newExamNumber = Object.keys(questions).length + 1;
  
      try {
        const response = await fetch('/api/add-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId: id,
            name: extractedData.name,
            exam: newExamNumber,
            detel: extractedData.detel,
            category: extractedData.category,
            code: extractedData.code,
            testCase:extractedData.testCase,
            expectedResults:extractedData.expectedResults
          }),
        });
  
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          // Update local state
          setQuestions(prevQuestions => ({
            ...prevQuestions,
            [newExamNumber]: {
              name: extractedData.name,
              exam: String(newExamNumber),
              detel: extractedData.detel,
              category: extractedData.category,
              createdAt,
              isUse: false,
              code: extractedData.code,
              testCase:extractedData.testCase,
              expectedResults:extractedData.expectedResults
            }
          }));
          window.location.href = `${id}/exam/${newExamNumber}`;
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error uploading data:', error);
        alert('An error occurred while uploading the data');
      }
    };
    reader.readAsText(file);
  };

  const parseFileContent = (content) => {
    const nameMatch = content.match(/NAME\s*=\s*{\s*"([^"]*)"\s*}/);
    const categoryMatch = content.match(/CATEGORY\s*=\s*{\s*"([^"]*)"\s*}/);
    const detelMatch = content.match(/DETEL\s*=\s*{\s*"([^"]*)"\s*}/);
    const codeMatch = content.match(/CODE\s*=\s*{\s*"([^"]*)"\s*}/);
    const testCaseMatch = content.match(/TESTCASE\s*=\s*{\s*"([^"]*)"\s*}/);
    const expectedResultsMatch = content.match(/EXPECTED_RESULTS\s*=\s*{\s*"([^"]*)"\s*}/);
  
    return {
      name: nameMatch ? nameMatch[1] : '',
      category: categoryMatch ? categoryMatch[1] : '',
      detel: detelMatch ? detelMatch[1] : '',
      code: codeMatch ? codeMatch[1] : '',
      testCase: testCaseMatch ? testCaseMatch[1] : '',
      expectedResults: expectedResultsMatch ? expectedResultsMatch[1] : ''
    };
  };

  const addQuestion = async () => {
    try {
      if(nameQuestions === ""){
        alert("กรุณากรอกชื่อโจทย์ด้วย");
        return;
      }
      if(categoryQuestions === ""){
        alert("กรุณากรอกชื่อหมวดหมู่ด้วย");
        return;
      }
      if(deleteQuestion === ""){
        alert("กรุณากรอกรายละเอียดด้วย");
        return;
      } 
      
      const newExamNumber = Array.isArray(questions) ? questions.length + 1 : Object.keys(questions).length + 1;
      const response = await fetch('/api/add-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          roomId: id, 
          name: nameQuestions,
          exam: newExamNumber,
          detel: detelQuestions,
          category: categoryQuestions,
          code:""
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setNameQuestions('');
        setDetelQuestions('');
        setCategoryQuestions('');
        handleCloseModal();
        window.location.href = `${id}/exam/${newExamNumber}`;
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกโจทย์');
    }
  };

  const deleteQuestion = async () => {
    if (!selectedExam) return;

    // console.log("SE:",selectedExam)
  
    try {
      const result = await fetch('/api/deleteQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: id,
          questionKey: selectedExam
        })
      });
  
      if (result.ok) {
        // อัปเดตสถานะ local หลังจากลบสำเร็จ
        const updatedQuestions = { ...questions };
        delete updatedQuestions[selectedExam];
        setQuestions(updatedQuestions);
        setSelectedExam('');
        handleCloseModalDelete();
      } else {
        console.error('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };
  

  const handleExit = () => {
    // Redirect to another page
    router.push('/');
  };
  
  const handleEditNickname = () => {
    setShowModal(true);
  };

  const handleSaveNickname = async (newNickname) => {
    const response = await fetch(`/api/add-name?roomNumber=${room.roomNumber}&email=${email}&name=${newNickname}&roles=${host}`, {
      method: 'GET',
    });
    const data = await response.json();
    if (data) {
      // Update the room state to reflect the new nickname
      fetchRoomData();
    }

    if(!newNickname){
      alert(`แก้ไขชื่อเล่นไม่สำเร็จ!!!!!!`);
    }else {
      alert(`แก้ไขชื่อเล่น ${newNickname} สำเร็จแล้ว`);
    }
    
  };

  const editCategory = async (cq,isUseUpdate) => {
    
    try {
      const response = await fetch('/api/edit-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: id,
          oldCategory: selectedCategory,
          newCategory: categoryQuestions || cq,
          isUse: isUseUpdate, // ส่งค่า isUse ถ้าเป็น true หรือ false
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setCategoryQuestions('');
        setModalEditOpen(false);
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error editing category:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่');
    }
  };

  const moveCategory = async () => {
    if (!selectedExam || !newCategory) return;
  
    try {
      const response = await fetch('/api/move-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: id,
          examKey: selectedExam,
          newCategory: newCategory
        })
      });
  
      if (response.ok) {
        const updatedQuestions = { ...questions };
        updatedQuestions[selectedExam].category = newCategory;
        setQuestions(updatedQuestions);
        setSelectedExam('');
        setNewCategory('');
        setIsMovingCategory(false);
        alert('ย้ายหมวดหมู่สำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการย้ายหมวดหมู่');
      }
    } catch (error) {
      console.error('Error moving category:', error);
      alert('เกิดข้อผิดพลาดในการย้ายหมวดหมู่');
    }
  };

  

  const handleAddQestion = async () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleDeleteQestion = async () => {
    setIsModalOpenDelete(true);
  };

  const handleCloseModalDelete = () => {
    setIsModalOpenDelete(false);
    setSelectedExam("");
  };

  const handleOpenEditModal = (category) => {
    setSelectedCategory(category);
    setCategoryQuestions(category);
    setModalEditOpen(true); // เปิด Modal
  };
  
  const handleCloseEditModal = () => {
    setSelectedCategory('');
    setModalEditOpen(false); // ปิด Modal
  };


    // JSX Part
    return (
      <div>
        <Layout pageTitle={`${rooms} (${id})`}>
          {loading ? (
            <Loading />
          ) : (
            <>
              {users && users.includes(email) || host === "host" ? (
                <>
                  {room ? (
                    <>
                      <nav className='my-5 space-x-3'>
                        <button className='text-sm btn-gray' onClick={handleExit}>Exit Room</button>
                        {/* เช็กตรวจโจทย์ */}
                        {host === "host" ? <button className="text-sm btn-primary" onClick={checkExam}>ตรวจโจทย์</button>:
                        <>
                        {/* Profile */}
                        <Link href={`/room/${id}/profile/${profileNumber}`}>
                           <button className='btn-alert text-sm'>Profile</button>
                        </Link>
                        </>}
                        <Link href="/room/[id]/leaderboard" as={`/room/${id}/leaderboard`}>
                           <button className="text-sm btn-secondary">Leaderboard</button>
                        </Link>
                      </nav>
                      {host === "host" ? (
                        // ของ Host
                        <>
                          <center className='text-2xl bg-red-500 text-white text-center uppercase'>Host</center>           
                          <header className='my-5'>
                          <a className="inline-block text-sm cursor-pointer gray-text" onClick={() => openEditRoomNameModal()}>
                             แก้ไข</a>
                          <h1 className="text-2xl">ชื่อห้อง :<span> {room.roomName} ({room.roomNumber})</span> </h1>
                          <h1 className="text-2xl">Welcome <span className='error-text'>{email} </span>({room.hostName})</h1>
                          </header>
{/* modal แก้ไขชื่อห้อง */}
    <Modal
      isOpen={isEditRoomNameModalOpen}
      onRequestClose={closeEditRoomNameModal}
      overlayClassName="modal-overlay"
      className="modal-container"
      contentLabel="Edit Room Name Modal"
    >
      <h1 className='mb-5'>Edit Room Name</h1>
      <input required
        type="text"
        value={newRoomName}
        onChange={handleRoomNameChange}
        className='mb-5 input'
      />
     
      <button className='mr-4 btn-gray' onClick={closeEditRoomNameModal}>Cancel</button>
      <button className='mr-4 btn-secondary' onClick={saveNewRoomName}>Save</button>    
    </Modal>

{/*  ลบผู้ใช้ออกห้อง */}
    {isModalOpenRemoveUser && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h1 className="text-lg text-black font-medium mb-4">เลือกผู้ใช้เพื่อลบออกจากห้อง</h1>
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกผู้ใช้</option>
       
          {room.users.map(user => (
            <option key={user} value={user}>
              {user}
            </option>
          ))
        }
      </select>

      <div className="flex justify-end">
        <button
          className="mr-4 btn-primary"
          onClick={handleCloseModalRemoveUser}
        >
          ยกเลิก
        </button>
        <button
          className="btn-error"
          onClick={removeUserFromRoom}
          disabled={!selectedUser}
        >
          ลบผู้ใช้
        </button>
      </div>
    </div>
  </div>
)}

<main>
  {/* อัพโหลดโจทย์ python */}
  <section className='my-5'>
  <h1>Upload Python File</h1>
  <form onSubmit={handleSubmit} className='file-upload-form mt-3 flex flex-col space-y-3 mx-auto'>
      <label
        htmlFor="file"
        className="file-upload-label cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={triggerFileInput} // Ensure clicking label opens file dialog
      >
        <div className="file-upload-design">
          <svg viewBox="0 0 640 512" height="1em">
            <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z"></path>
          </svg>
          {file ? (
            <p>{file.name}</p>
          ) : (
            <>
              <p>Drag and Drop</p>
              <p>or</p>
              <span className="browse-button">Browse file</span>
            </>
          )}
        </div>
        <input
          type="file"
          accept=".py"
          onChange={handleFileChange}
          id="file"
          style={{ display: 'none' }} // Hide input
        />
      </label>
      <button className='text-sm btn-secondary w-[100px] mx-auto' type="submit">Upload</button>
    </form>
  </section>
</main>

  
{/* Modal แก้ไขชื่อหมวดหมู่และซ่อน/แสดง */}
<Modal isOpen={modalEditOpen} onRequestClose={handleCloseEditModal}
 overlayClassName="modal-overlay"
 className="modal-container">
  <h2 className='mb-4'>Edit Category : {selectedCategory}</h2>
  <input className='input' required type="text" value={categoryQuestions} onChange={(e) => setCategoryQuestions(e.target.value)} />
  {selectedCategory && (
    <div className='my-4 space-x-2'>
      {Object.values(questions).some(q => q.category === selectedCategory && q.isUse) ? 
      <>
        <button className='btn-primary' onClick={() => editCategory(selectedCategory, false)}>ซ่อน</button>
        <button className='btn-gray' onClick={handleCloseEditModal}>Cancel</button>
        <button className='btn-secondary' onClick={() => editCategory()}>Save Changes</button> 
      </>
        : 
        <>
          <button className='btn-primary' onClick={() => editCategory(selectedCategory, true)}>แสดง</button>
          <button className='btn-gray' onClick={handleCloseEditModal}>Cancel</button>
          <button className='btn-secondary' onClick={() => editCategory()}>Save Changes</button>
        </>
        }
    </div>
  )}
  
</Modal>
                          {/* modal ข้อสอบ */}
                          <Modal isOpen={modalIsOpen} onRequestClose={closeModal}
                          overlayClassName="modal-overlay"
                          className="modal-container"
                          >
                            <h2 className='mb-3'>{selectedExam?.name}</h2><hr />
                            <p className='mt-3 mb-5'>{selectedExam?.detel}</p><hr />
                            <button className='mt-4 mr-3 btn-primary' onClick={startExam}>แก้ไขโจทย์</button>
                            <button className='btn-gray' onClick={closeModal}>ปิด</button>
                          </Modal>
  
                          {/* ปุ่ม */}
                            <div className="flex justify-center space-x-2">
                              <button className='btn-primary' onClick={handleAddQestion}>เพิ่มโจทย์</button>
                              {Object.keys(questions).length > 0 && (
                                <>
                                  <button className='btn-error' onClick={handleDeleteQestion}>ลบโจทย์</button>
                                  <button className='btn-alert' onClick={() => setIsMovingCategory(true)}>ย้ายหมวดหมู่</button>
                                </>
                              )}
                            </div>
{/* ย้ายหมวดหมู่ */}
{isMovingCategory && hasQuestions && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h1 className="text-lg text-black font-medium mb-4">เลือกโจทย์เพื่อย้ายหมวดหมู่</h1>
      <select
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกโจทย์</option>
        {Object.entries(questions).map(([key, question]) => (
          <option key={key} value={key}>
            {question.name || `โจทย์ ${key}`}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        placeholder="ใส่ชื่อหมวดหมู่ใหม่"
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      />

      <div className="flex justify-end">
        <button
          className="mr-4 btn-gray"
          onClick={() => setIsMovingCategory(false)}
        >
          ยกเลิก
        </button>
        <button
          className="btn-alert"
          onClick={moveCategory}
          disabled={!selectedExam || !newCategory}
        >
          ย้ายหมวดหมู่
        </button>
      </div>
    </div>
  </div>
)}
  {/* ลบโจทย์ */}
{isModalOpenDelete && hasQuestions && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h1 className="text-lg text-black font-medium mb-4">เลือกโจทย์เพื่อลบ</h1>
      <select
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกโจทย์</option>
        {Object.entries(questions).map(([key, question]) => (
          <option key={key} value={key}>
            {question.name || `โจทย์ ${key}`}
          </option>
        ))}
      </select>

      <div className="flex justify-end">
        <button
          className="mr-4 btn-gray"
          onClick={handleCloseModalDelete}
        >
          ยกเลิก
        </button>
        <button
          className="btn-error"
          onClick={deleteQuestion}
          disabled={!selectedExam}
        >
          ลบโจทย์
        </button>
      </div>
    </div>
  </div>
)}
                         <br />
  {/* เพิ่มโจทย์ */}
{isModalOpen && (
    <div className="modal-overlay">
      <div className="modal-container">
        <h1 className="text-lg text-black font-medium mb-4">ชื่อโจทย์</h1>
        <input required
          type="text"
          value={nameQuestions}
          onChange={(e) => {
            const inputText = e.target.value;
            if (inputText.length <= 20) {
              setNameQuestions(inputText);
            } else {
              alert('ชื่อห้องต้องมีไม่เกิน 20 ตัวอักษร');
            }
          }}
          onBlur={(e) => {
            const inputText = e.target.value.trim();
            if (inputText.length === 0) {
              setNameQuestions(`โจทย์ ${Object.keys(questions).length > 0 ? Object.keys(questions).length+1 : 1}`);
            }
          }}
          className="border text-black border-gray-300 rounded px-4 py-2 w-full mb-4"
          placeholder="ชื่อโจทย์ เช่น โจทย์ 1"
        /> 
        <h1 className="text-sm text-black font-medium mb-4">หมวดหมู่โจทย์:</h1>
        <input  className=" border text-black  border-gray-300 rounded px-4 py-2 w-full mb-4"
         required type="text" value={categoryQuestions} placeholder="หมวดหมู่โจทย์ เช่น หมวดหมู่ 1"
         onChange={(e) => {
          const inputText = e.target.value;
          if (inputText.length <= 30) {
            setCategoryQuestions(inputText);
          } else {
            alert('หมวดหมู่โจทย์ต้องมีไม่เกิน 30 ตัวอักษร');
          }
        }}
        onBlur={(e) => {
          const inputText = e.target.value.trim();
          if (inputText.length === 0) {
            setCategoryQuestions(`หมวดหมู่ ${Object.keys(questions).length > 0 ? Object.keys(questions).length+1 : 1}`);
          }
        }} />

        <h1 className="text-sm text-black font-medium mb-4">รายละเอียดโจทย์:</h1>
        <textarea required
          type="text"
          rows={6}
          value={detelQuestions}
          onChange={(e) => {
            const inputText = e.target.value;
            if (inputText.length <= 500) {
              setDetelQuestions(inputText);
            } else {
              alert('รายละเอียดโจทย์ต้องมีไม่เกิน 500 ตัวอักษร');
            }
          }}
          onBlur={(e) => {
            const inputText = e.target.value.trim();
            if (inputText.length === 0) {
              setDetelQuestions(`รายละเอียดโจทย์ ${Object.keys(questions).length > 0 ? Object.keys(questions).length+1 : 1}`);
            }
          }}
          className=" border text-black rounded px-4 py-2 w-full mb-4"
          placeholder="รายละเอียดโจทย์ เช่น รายละเอียดโจทย์ 1"
        />
  
        <div className="flex justify-center">
          <button className="mr-4 btn-gray" onClick={handleCloseModal}>ยกเลิก</button>
          <button className="btn-primary" onClick={addQuestion}>เพิ่มโจทย์</button>
        </div>
      </div>
    </div>
  )}


  
  {/* โจทย์ทั้งหมด */}
  <div>
  {Object.keys(questions).length > 0 ? (
    Array.from(new Set(Object.values(questions).map(question => question.category)))
      .sort((a, b) => {
        const latestA = Math.max(...Object.values(questions)
          .filter(q => q.category === a)
          .map(q => new Date(q.createdAt).getTime()));
        const latestB = Math.max(...Object.values(questions)
          .filter(q => q.category === b)
          .map(q => new Date(q.createdAt).getTime()));
        return latestB - latestA; // เรียงจากใหม่ไปเก่า
      })
      .map((category, index) => (
        <div key={index} className=' space-y-3 mb-6'>
          <h1 className='my-3 text-xl items-center'>
            <a className="text-sm cursor-pointer gray-text" onClick={() => handleOpenEditModal(category)}>
              แก้ไข
            </a>
            <br />
            <span>{category}</span>
            <span> - {Object.values(questions).find(q => q.category === category)?.isUse ? "แสดง" : "ซ่อน"}</span>
          </h1>
          {Object.values(questions)
            .filter(question => question.category === category)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // เรียงคำถามในหมวดหมู่จากใหม่ไปเก่า
            .map((question, qIndex) => (
              <button className='mx-1 text-lg btn-primary' key={qIndex} onClick={() => openModal(question)}>
                {question.name || `โจทย์ ${qIndex + 1}`}
              </button>
            ))
          }
        </div>
      ))
  ) : (
    ""
  )}
</div>

  <br />
 {/* เลขโจทย์และเฉลย */}
  <h2 className='text-2xl'>เลขโจทย์และเฉลย</h2>
{(Array.isArray(questions) ? questions.length > 0 : Object.keys(questions).length > 0) ? (
  <div>
    {(Array.isArray(questions) ? questions : Object.values(questions)).map((question, index) => (
      <p key={index}>{index + 1}. {question.code || "ไม่มีเฉลย"}</p>
    ))}
  </div>
) : (
  <p>ไม่มีเลขโจทย์และเฉลย</p>
)}

<br />
{/* แก้ไขชื่อเล่น */}
<button onClick={handleEditNickname} className=' text-sm btn-gray'>
                              แก้ไขชื่อเล่น
                            </button>
                            <NicknameModal
                            show={showModal}
                            onClose={() => setShowModal(false)}
                            onSave={handleSaveNickname}
                            initialNickname={nickname}
                          />
                          <br />

<button className="mt-4 btn-error text-sm" onClick={handleOpenModalRemoveUser}>ลบผู้ใช้ออกจากห้อง</button>

<h1 className="text-2xl mt-5">มีใครบ้าง :</h1>
                    <ul className='mt-3'><li className="text-red-500 text-lg">{room.hostName} ( Host )</li></ul>
                    {room.scores ? (
                      <>
                       <ul className='mb-10'>
                        {room.scores.map((user, index) => (
                          <li key={index} className="my-2">
                            <Link href={`/room/${id}/profile/${index + 1}`} className='inline-block text-blue-500 hover:text-blue-700 text-lg'>
                              {user.name} ( User )
                            </Link>
                          </li>
                        ))}
                      </ul>

                        
                      </>
                    ) : (<> </>)}
<br /><br />
  
  
                        </>
                      ) : (
                        // ของ Client
                        <>
                          <center className='text-2xl bg-yellow-600 text-white text-center uppercase'>Client</center>
                          <header className='my-8'>
                            <h1 className="text-2xl">ชื่อห้อง :<span> {room.roomName} ({room.roomNumber})</span> </h1>
                            <h1 className="text-2xl">Welcome <span className='text-yellow-600'>{email} </span>(User)</h1>
                          </header>
                            <NicknameModal
                            show={showModal}
                            onClose={() => setShowModal(false)}
                            onSave={handleSaveNickname}
                            initialNickname={nickname}
                          />
                          <div>
  {Object.keys(questions).length > 0 ? (
    Array.from(new Set(Object.values(questions).map(question => question.category)))
      .filter(category => 
        Object.values(questions).some(question => question.category === category && question.isUse)
      )
      .sort((a, b) => {
        const latestA = Math.max(...Object.values(questions)
          .filter(q => q.category === a)
          .map(q => new Date(q.createdAt).getTime()));
        const latestB = Math.max(...Object.values(questions)
          .filter(q => q.category === b)
          .map(q => new Date(q.createdAt).getTime()));
        return latestB - latestA; // เรียงจากใหม่ไปเก่า
      })
      .map((category, index) => (
        <div key={index} className=' space-y-3 mb-6'>
        <h1 className='my-3 text-xl items-center'>
          <br />
          <span>{category}</span>
        </h1>
        {Object.values(questions)
          .filter(question => question.category === category)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // เรียงคำถามในหมวดหมู่จากใหม่ไปเก่า
          .map((question, qIndex) => (
            <button className='mx-1 text-lg btn-primary' key={qIndex} onClick={() => openModal(question)}>
              {question.name || `โจทย์ ${qIndex + 1}`}
            </button>
          ))
        }
      </div>
      ))
  ) : (
    ""
  )}
</div>

                        <Modal isOpen={modalIsOpen} onRequestClose={closeModal}
                          overlayClassName="modal-overlay"
                          className="modal-container"
                          >
                            <h2 className='mb-3'>{selectedExam?.name}</h2><hr />
                            <p className='mt-3 mb-5 text-lg'>{selectedExam?.detel}</p><hr />
                            <button className='mt-4 mr-3 btn-primary' onClick={startExam}>เริ่มทำโจทย์</button>
                            <button className='btn-gray' onClick={closeModal}>ปิด</button>
                        </Modal>

                      {/* เพิ่ม name */}
                      <button onClick={handleEditNickname} className='text-sm btn-gray mt-10'>
                              แก้ไขชื่อเล่น
                      </button>
                        <h1 className="text-2xl mt-5">มีใครบ้าง :</h1>
                    <ul className='mt-3'><li className="text-red-500 text-lg">{room.hostName} (HOST)</li></ul>
                    {room.scores ? (
                      <>
                       <ul className='mb-10'>
                        {room.scores.map((user, index) => (
                          <li key={index} className="my-2">
                            <Link href={`/room/${id}/profile/${index + 1}`} className='inline-block text-blue-500 hover:text-blue-700 text-lg'>
                              {user.name} ( User )
                            </Link>
                          </li>
                        ))}
                      </ul>

                        
                      </>
                    ) : (<> </>)}
                     

                      
                        </>
                      )}
                    </>
                  ) : (
                    <Loading />
                  )}
                </>
              ) : (<>
                {email ? (
                  <>
                <br />
                  <h1 className='text-3xl mt-5'>ไม่อนุญาตให้ตรวจสอบข้อมูลในห้องอื่น ถ้ายังไม่ได้เข้าร่วมห้อง</h1>
                  <div className='text-xl mt-5'>
                  <Link href={{
                pathname: '/room/[id]',
                query: { id: `${id}`},
              }}>ย้อนกลับไป</Link>
                  </div>
                  </>
                ):(
                <>
                  <br />
                  <h1 className='text-3xl mt-5'>ยังไม่ได้เข้าสู่ระบบ</h1>
                  <div className='text-xl mt-5'>
                    <Link href="/" >ย้อนกลับไป</Link>
                  </div>
                </>
              )}
                      </>
                    )}
                    </>
          )}
        </Layout>
      </div>
    );
  };
  
  

export async function getServerSideProps(context) {
  const { id } = context.params; // `id2` is the `profileNumber`
  const req = context.req;
  const res = context.res;
  let email = getCookie('email', { req, res });

  if (!email) {
    email = false;
  }

  // Fetch user data from MongoDB
  const client = await clientPromise;
  const db = client.db("test");

  const room = await db.collection("rooms").findOne({ roomNumber: id });
  if (!room) {
    return {
      notFound: true,
    };
  }


  // Ensure users is an array or null
  const users = room.users || null;
  // console.log("Initial questions data:", room.questions);
  return {
    props: {
      email,
      roomNumber: id, // ส่ง roomNumber ไปด้วย
      users,
      initialQuestions: room.questions || {},  
      rooms :room.roomName || "ห้อง "
    },
  };
}


export default Room;