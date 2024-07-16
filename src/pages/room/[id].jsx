import { useRouter } from 'next/router';
import React, { useEffect, useState,useCallback } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout';
import { getCookie } from 'cookies-next';
import styles from '../../components/style.module.css'; // นำเข้า CSS ไฟล์
import NicknameModal from '@/components/NicknameModal';
import Loading from '@/components/Loading'; // นำเข้า component Loading
import clientPromise from '../../lib/mongodb';
import Modal from 'react-modal';


// ตั้งค่าการใช้ modal ในแอป
Modal.setAppElement('#__next');

const Room = ({ email ,users, initialQuestions }) => {
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

  const [questions, setQuestions] = useState(initialQuestions);
  const hasQuestions = Array.isArray(questions) ? questions.length > 0 : Object.keys(questions).length > 0;
  const [newCategory, setNewCategory] = useState('');
  const [isMovingCategory, setIsMovingCategory] = useState(false);
  const [isModalOpenRemoveUser, setIsModalOpenRemoveUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

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

  const uploadPython = async (e) => {
    e.preventDefault();
  
    if (!file) {
      alert('Please select a file');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const extractedData = parseFileContent(content);
      
      // Get the current date in ISO format
      const createdAt = new Date().toISOString();
  
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
            createdAt,
            code: extractedData.code
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
              code: extractedData.code
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
  
    return {
      name: nameMatch ? nameMatch[1] : '',
      category: categoryMatch ? categoryMatch[1] : '',
      detel: detelMatch ? detelMatch[1] : '',
      code: codeMatch ? codeMatch[1] : ''
    };
  };

  const getThaiTimeISOString = () => {
    const now = new Date();
    const utcOffset = 7; // UTC+7 for Thailand
    now.setHours(now.getHours() + utcOffset);
    return now.toISOString();
  };

  const addQuestion = async () => {
    try {
      if(nameQuestions === ""){
        alert("กรุณากรอกชื่อข้อสอบด้วย");
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
      
      const createdAt = getThaiTimeISOString();
      
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
          code:"",
          createdAt
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
      setRoom((prevRoom) => ({
        ...prevRoom,
        users: prevRoom.users.map(user => 
          user.email === email ? { ...user, name: newNickname } : user
        )
      }));
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
        <Layout pageTitle="Welcome">
          {loading ? (
            <Loading />
          ) : (
            <>
              {users && users.includes(email) || host === "host" ? (
                <>
                  {room ? (
                    <>
                      <div>
                        <button className='text-sm mt-6 mb-6' onClick={handleExit}>Exit Room</button>
                      </div>
                      {host === "host" ? (
                        // ของ Host
                        <>
                          <center className='text-2xl bg-red-500 text-center uppercase'>Host</center>
                          <nav>
                          <a className="mt-10 inline-block text-sm cursor-pointer text-gray-500 hover:text-red-500" onClick={() => openEditRoomNameModal()}>
                             แก้ไข</a>
                          <h1 className="text-3xl">ชื่อห้อง :<span className='text-white'> {room.roomName}</span> </h1>
                          <h1 className="text-3xl mt-10">Welcome <span className={styles.greenText}>{email}</span> to Room
                          <span className={styles.yellowText}> {room.roomNumber}</span></h1>
                          </nav>
                          

    <Modal
      isOpen={isEditRoomNameModalOpen}
      onRequestClose={closeEditRoomNameModal}
      overlayClassName={styles.ReactModal__Overlay}
       className={styles.ReactModal__Content}
      contentLabel="Edit Room Name Modal"
    >
      <h2 className='mb-5'>Edit Room Name</h2>
      <input required
        type="text"
        value={newRoomName}
        onChange={handleRoomNameChange}
        className='mb-5'
      />
      <br />
      <button className='mr-4' onClick={saveNewRoomName}>Save</button>
      <button className='mr-4' onClick={closeEditRoomNameModal}>Cancel</button>
    </Modal>

    {isModalOpenRemoveUser && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg">
      <h1 className="text-lg text-black font-bold mb-4">เลือกผู้ใช้เพื่อลบออกจากห้อง</h1>
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
          className="mr-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          onClick={handleCloseModalRemoveUser}
        >
          ยกเลิก
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800"
          onClick={removeUserFromRoom}
          disabled={!selectedUser}
        >
          ลบผู้ใช้
        </button>
      </div>
    </div>
  </div>
)}

<button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800" onClick={handleOpenModalRemoveUser}>ลบผู้ใช้ออกจากห้อง</button>

  
  
                          <h1 className='mt-5'>Upload Python File</h1>
<form onSubmit={uploadPython} className='my-6'>
  <input
    required
    type="file"
    accept=".py"
    onChange={(e) => setFile(e.target.files[0])}
  />
  <br />
  <button className='mt-5' type="submit">Upload</button>
</form>
  
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
        <div key={index}>
          <h1 className='mt-10 mb-8 text-xl items-center'>
            <a className="text-sm cursor-pointer text-gray-500 hover:text-red-500" onClick={() => handleOpenEditModal(category)}>
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
              <button className='mx-1' key={qIndex} onClick={() => openModal(question)}>
                {question.name || `ข้อสอบ ${qIndex + 1}`}
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


{/* Modal for editing category */}
<Modal isOpen={modalEditOpen} onRequestClose={handleCloseEditModal}
 overlayClassName={styles.ReactModal__Overlay}
 className={styles.ReactModal__Content}>
  <h2 className='mb-5'>Edit Category : {selectedCategory}</h2>
  <input required type="text" value={categoryQuestions} onChange={(e) => setCategoryQuestions(e.target.value)} />
  <br />
  
  <button className='mr-4' onClick={() => editCategory()}>Save Changes</button>
  <button className='mr-4' onClick={handleCloseEditModal}>Cancel</button>
  
  {selectedCategory && (
    <div>
      {Object.values(questions).some(q => q.category === selectedCategory && q.isUse) ? 
        <button className='my-4' onClick={() => editCategory(selectedCategory, false)}>ซ่อน</button> 
        : 
        <button className='my-4' onClick={() => editCategory(selectedCategory, true)}>แสดง</button>}
    </div>
  )}
</Modal>


                      


                          <Modal isOpen={modalIsOpen} onRequestClose={closeModal}
                          overlayClassName={styles.ReactModal__Overlay}
                          className={styles.ReactModal__Content}
                          >
                            <h2 className='mb-3'>{selectedExam?.name}</h2><hr />
                            <p className='mt-3 mb-5'>{selectedExam?.detel}</p><hr />
                            <button className='mt-4 mr-3' onClick={startExam}>แก้ไขข้อสอบ</button>
                            <button onClick={closeModal}>ปิด</button>
                          </Modal>
  
                            <br />
                            <div className="flex justify-center space-x-2">
                              <button onClick={handleAddQestion}>เพิ่มข้อสอบ</button>
                              {Object.keys(questions).length > 0 && (
                                <>
                                  <button onClick={handleDeleteQestion}>ลบข้อสอบ</button>
                                  <button onClick={() => setIsMovingCategory(true)}>ย้ายหมวดหมู่</button>
                                </>
                              )}
                            </div>

                          {isMovingCategory && hasQuestions && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg">
      <h1 className="text-lg text-black font-bold mb-4">เลือกข้อสอบเพื่อย้ายหมวดหมู่</h1>
      <select
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกข้อสอบ</option>
        {Object.entries(questions).map(([key, question]) => (
          <option key={key} value={key}>
            {question.name || `ข้อสอบ ${key}`}
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
          className="mr-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          onClick={() => setIsMovingCategory(false)}
        >
          ยกเลิก
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
          onClick={moveCategory}
          disabled={!selectedExam || !newCategory}
        >
          ย้ายหมวดหมู่
        </button>
      </div>
    </div>
  </div>
)}
  
  
                          {isModalOpenDelete && hasQuestions && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg">
      <h1 className="text-lg text-black font-bold mb-4">เลือกข้อสอบเพื่อลบ</h1>
      <select
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกข้อสอบ</option>
        {Object.entries(questions).map(([key, question]) => (
          <option key={key} value={key}>
            {question.name || `ข้อสอบ ${key}`}
          </option>
        ))}
      </select>

      <div className="flex justify-end">
        <button
          className="mr-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          onClick={handleCloseModalDelete}
        >
          ยกเลิก
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800"
          onClick={deleteQuestion}
          disabled={!selectedExam}
        >
          ลบข้อสอบ
        </button>
      </div>
    </div>
  </div>
)}
                         <br />
  
                         {isModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-10 rounded-lg w-full max-w-[500px]">
        <h1 className="text-lg text-black font-bold mb-4">ชื่อข้อสอบ</h1>
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
              setNameQuestions(`ข้อสอบ ${Object.keys(questions).length > 0 ? Object.keys(questions).length+1 : 1}`);
            }
          }}
          className="border text-black bg-black border-gray-300 rounded px-4 py-2 w-full mb-4"
          placeholder="ชื่อข้อสอบ เช่น ข้อสอบ 1"
        /> 
        <h1 className="text-sm text-black font-bold mb-4">หมวดหมู่ข้อสอบ:</h1>
        <input  className="border text-black bg-black border-gray-300 rounded px-4 py-2 w-full mb-4"
         required type="text" value={categoryQuestions} placeholder="หมวดหมู่ข้อสอบ เช่น หมวดหมู่ 1"
         onChange={(e) => {
          const inputText = e.target.value;
          if (inputText.length <= 30) {
            setCategoryQuestions(inputText);
          } else {
            alert('หมวดหมู่ข้อสอบต้องมีไม่เกิน 30 ตัวอักษร');
          }
        }}
        onBlur={(e) => {
          const inputText = e.target.value.trim();
          if (inputText.length === 0) {
            setCategoryQuestions(`หมวดหมู่ ${Object.keys(questions).length > 0 ? Object.keys(questions).length+1 : 1}`);
          }
        }} />

        <h1 className="text-sm text-black font-bold mb-4">รายละเอียดข้อสอบ:</h1>
        <textarea required
          type="text"
          rows={5}
          value={detelQuestions}
          onChange={(e) => {
            const inputText = e.target.value;
            if (inputText.length <= 500) {
              setDetelQuestions(inputText);
            } else {
              alert('รายละเอียดข้อสอบต้องมีไม่เกิน 500 ตัวอักษร');
            }
          }}
          onBlur={(e) => {
            const inputText = e.target.value.trim();
            if (inputText.length === 0) {
              setDetelQuestions(`รายละเอียดข้อสอบ ${Object.keys(questions).length > 0 ? Object.keys(questions).length+1 : 1}`);
            }
          }}
          className=" border text-black bg-white border-green-500 rounded px-4 py-2 w-full mb-4"
          placeholder="รายละเอียดข้อสอบ เช่น รายละเอียดข้อสอบ 1"
        />
  
        <div className="flex justify-center">
          <button className="mr-4 bg-gray-700 px-4 py-2 rounded hover:bg-red-800" onClick={handleCloseModal}>ยกเลิก</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800" onClick={addQuestion}>เพิ่มข้อสอบ</button>
        </div>
      </div>
    </div>
  )}
  
  {Object.keys(questions).length > 0 ?
  (<>
  <div className="flex justify-center">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800" onClick={checkExam}>ตรวจข้อสอบ</button>
  </div>
  </>):""}
  
  
  <br />
 
  <h2 className='text-2xl'>เลขข้อสอบและเฉลย</h2>
{(Array.isArray(questions) ? questions.length > 0 : Object.keys(questions).length > 0) ? (
  <div>
    {(Array.isArray(questions) ? questions : Object.values(questions)).map((question, index) => (
      <p key={index}>{index + 1}. {question.question || "ไม่มีเฉลย"}</p>
    ))}
  </div>
) : (
  <p>ไม่มีเลขข้อสอบและเฉลย</p>
)}

<br />
{/* เพิ่ม name */}
<button onClick={handleEditNickname} className=' inline-block hover:text-green-500'>
                              แก้ไขชื่อเล่น
                            </button>
                            <NicknameModal
                            show={showModal}
                            onClose={() => setShowModal(false)}
                            onSave={handleSaveNickname}
                            initialNickname={nickname}
                          />

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

                        <div className='text-xl mt-5 mb-10'>
                          <Link href="/room/[id]/leaderboard" as={`/room/${id}/leaderboard`}>
                            Go to Leaderboard
                          </Link>
                        </div>
                      </>
                    ) : (<> </>)}
<br /><br />
  
  
                        </>
                      ) : (
                        // ของ Client
                        <>
                          <center className='text-2xl bg-yellow-700 text-center uppercase'>Client</center>
                          <h1 className="text-3xl mt-10">ชื่อห้อง :<span className='text-white'> {room.roomName}</span> </h1>
                          <h1 className="text-3xl mt-10">Welcome <span className={styles.greenText}>{email}</span> to Room
                          <span className={styles.yellowText}> {room.roomNumber}</span></h1>
                          <center className='space-x-2'>
                            {/* Profile */}
                            <Link className='text-center inline-block mt-8 text-white hover:text-green-500' href={`/room/${id}/profile/${profileNumber}`}>
                              <button>Profile</button>
                            </Link>
                            {/* เพิ่ม name */}
                            <button onClick={handleEditNickname} className=' inline-block hover:text-green-500'>
                              แก้ไขชื่อเล่น
                            </button>
                          </center>
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
        <div key={index}>
          <h1 className='mt-10 mb-8 text-xl items-center'>
            <span>{category}</span>
          </h1>
          {Object.values(questions)
            .filter(question => question.category === category && question.isUse)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // เรียงคำถามในหมวดหมู่จากใหม่ไปเก่า
            .map((question, qIndex) => (
              <button className='mx-1' key={qIndex} onClick={() => openModal(question)}>
                {question.name || `ข้อสอบ ${qIndex + 1}`}
              </button>
            ))
          }
        </div>
      ))
  ) : (
    ""
  )}
</div>

<Modal
  isOpen={modalIsOpen}
  onRequestClose={closeModal}
  overlayClassName={styles.ReactModal__Overlay}
  className={styles.ReactModal__Content}
>
  <h2 className='mb-3'>{selectedExam?.name}</h2>
  <hr />
  <p className='mt-3 mb-5'>{selectedExam?.detel}</p>
  <hr />
  <button className='mt-4 mr-3' onClick={() => router.push(`${id}/exam/${selectedExam?.exam}`)}>
    เริ่มทำข้อสอบ
  </button>
  <button onClick={closeModal}>ปิด</button>
</Modal>

                        <br />
                        <h1 className="text-2xl mt-10">มีใครบ้าง :</h1>
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

                        <div className='text-xl mt-5 mb-10'>
                          <Link href="/room/[id]/leaderboard" as={`/room/${id}/leaderboard`}>
                            Go to Leaderboard
                          </Link>
                        </div>
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
      
    },
  };
}


export default Room;