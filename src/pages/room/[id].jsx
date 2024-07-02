import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
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

const Room = ({ email ,users, initialQuestions}) => {
  const router = useRouter();
  const { id } = router.query;
  const [room, setRoom] = useState(null);
  const [host, setHost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [profileNumber, setProfileNumber] = useState(null);
  const [loading, setLoading] = useState(true); // เพิ่ม state เพื่อเก็บสถานะการโหลด

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [nameQuestions, setNameQuestions] = useState('');
  const [detelQuestions, setDetelQuestions] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);

  const openModal = (exam) => {
    setSelectedExam(exam);
    setModalIsOpen(true);
  };
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedExam(null);
  };
  const startExam = () => {
    closeModal();
    router.push(`${id}/exam/${selectedExam.exam}`);
  };

  const addQuestion = async () => {
    try {
      if(nameQuestions === ""){
        alert("กรุณากรอกชื่อข้อสอบด้วย");
        return 
      }
      const response = await fetch('/api/add-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: id, name:nameQuestions,exam:parseInt(initialQuestions.length+1) ,detel:detelQuestions ,roles:'save' }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setNameQuestions(''); // เพิ่มคำถามใน state
        handleCloseModal();
        window.location.href = `${id}/exam/${parseInt(initialQuestions.length+1)}`;
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกโจทย์');
    }
  };

  const deleteQuestion = async () => {
    try {
      
      const response = await fetch('/api/add-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: id, name:nameQuestions,exam:selectedExam,roles:'delete', }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        handleCloseModalDelete();
        window.location.reload();
      } else {
        alert('Failed to delete question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Internal server error');
    }
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        if (!id) return;

        const res = await fetch(`/api/room/${id}`);
        if (!res.ok) {
          throw new Error('Room not found');
        }

        const data = await res.json();
        const { room } = data;

        setRoom(room);

        switch (true) {
          case email === room.userHost:
            setHost("host");
            break;
          default:
            const index = room.users.findIndex(user => user === email);
            setProfileNumber(index + 1);
            break;
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        // Handle error, such as redirecting to room selection page
      } finally {
        setLoading(false); // ตั้งค่า loading เป็น false เมื่อการประมวลผลเสร็จสิ้น
      }
    };

    fetchRoomData();
  }, [id, email]);
  

  const handleExit = () => {
    // Redirect to another page
    router.push('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newScore = prompt(`กรุณาใส่คะแนนที่ต้องการเพิ่ม ของอีเมล ${email}`, "100");
    // ตรวจสอบถ้าผู้ใช้กด Cancel
    if (newScore === null) {
      alert('ไม่ได้เพิ่มหรือแก้คะแนน');
      return;
    }
    try {
      const response = await fetch(`/api/add-score?roomNumber=${room.roomNumber}&email=${email}&score=${newScore}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to add score');
      }
      const data = await response.json();
      alert(`เพิ่มข้อมูล ${email} สำเร็จแล้ว`); // แจ้งเตือนว่าเพิ่มข้อมูลสำเร็จ
    } catch (error) {
      console.error('Error adding score:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มคะแนน');
    }
  };
  
  
  const handleEditNickname = () => {
    setShowModal(true);
  };

  const handleSaveNickname = async (newNickname) => {
    const response = await fetch(`/api/add-name?roomNumber=${room.roomNumber}&email=${email}&name=${newNickname}`, {
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
    }
    if(!newNickname){
      alert(`แก้ไขชื่อเล่นไม่สำเร็จ!!!!!!`);
    }else {
      alert(`แก้ไขชื่อเล่น ${newNickname} สำเร็จแล้ว`);
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
    setSelectedExam(''); // รีเซ็ตการเลือกข้อสอบ
  };

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
                        <h1 className="text-3xl mt-10">ชื่อห้อง :<span className='text-white'> {room.roomName}</span> </h1>
                        <h1 className="text-3xl mt-10">Welcome <span className={styles.greenText}>{email}</span> to Room
                        <span className={styles.yellowText}> {room.roomNumber}</span></h1>

                        <br />
                        <h1>ข้อสอบ ({initialQuestions.length > 0 ? initialQuestions.length : "ไม่มี"})</h1>
                        <br />
                        <div style={{ display: 'flex', gap: '10px',justifyContent:'center' }}>
                          {initialQuestions.map((exam) => (
                            <button key={exam.exam} onClick={() => openModal(exam)}>
                              {exam.name}
                            </button>
                          ))}
                        </div>

                        <Modal isOpen={modalIsOpen} onRequestClose={closeModal}
                        overlayClassName={styles.ReactModal__Overlay}
                        className={styles.ReactModal__Content}
                        >
                          <h2 className='mb-3'>{selectedExam?.name}</h2><hr />
                          <p className='mt-3 mb-5'>{selectedExam?.detel}</p><hr />
                          <button className='mt-4 mr-3' onClick={startExam}>เริ่มทำข้อสอบ</button>
                          <button onClick={closeModal}>ปิด</button>
                        </Modal>

                          <br />
                        <div className="flex justify-center space-x-2">
                        <button onClick={handleAddQestion}>เพิ่มข้อสอบ</button>
                        {initialQuestions.length != 0 ?(
                          <button onClick={handleDeleteQestion}>ลบข้อสอบ</button>
                        ):(<></>)}
                        </div>


                        {isModalOpenDelete && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg">
      <h1 className="text-lg text-black font-bold mb-4">เลือกข้อสอบเพื่อลบ</h1>
      <select
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกข้อสอบ</option>
        {initialQuestions.map((question, index) => (
          <option key={index} value={question.exam}>
            {question.name || `ข้อสอบ ${index + 1}`}
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
            setNameQuestions(`ข้อสอบ ${initialQuestions.length > 0 ? initialQuestions.length+1 : 1}`);
          }
        }}
        className="border text-black bg-black border-gray-300 rounded px-4 py-2 w-full mb-4"
        placeholder="ชื่อข้อสอบ เช่น ข้อสอบ 1"
      /> <br />
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
            setDetelQuestions(`รายละเอียดข้อสอบ ${initialQuestions.length > 0 ? initialQuestions.length+1 : 1}`);
          }
        }}
        className="border text-black bg-white border-green-500 rounded px-4 py-2 w-full mb-4"
        placeholder="รายละเอียดข้อสอบ เช่น รายละเอียดข้อสอบ 1"
      />

      <div className="flex justify-center">
        <button className="mr-4 bg-gray-700 px-4 py-2 rounded hover:bg-red-800" onClick={handleCloseModal}>ยกเลิก</button>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800" onClick={addQuestion}>เพิ่มข้อสอบ</button>
      </div>
    </div>
  </div>
)}


<br />
<h2 className='text-2xl'>เลขข้อสอบและเฉลย</h2>
                        {room.questions.length > 0 ? (
                          <div>
                            {room.questions.map((question, index) => (
                              <div key={index}>
                                <p>
                                  {index + 1}. {question.question ? `${question.question}` :"ไม่มี"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>ไม่มีเลขข้อสอบและเฉลย</p>
                        )}


                      </>
                    ) : (
                      // ของ Client
                      <>
                        <center className='text-2xl bg-yellow-700 text-center uppercase'>Client</center>
                        <h1 className="text-3xl mt-10">ชื่อห้อง :<span className='text-white'> {room.roomName}</span> </h1>
                        <h1 className="text-3xl mt-10">Welcome <span className={styles.greenText}>{email}</span> to Room
                        <span className={styles.yellowText}> {room.roomNumber}</span></h1>

                        <br />
                        

                        <br />
                       
                        {initialQuestions.length > 0 && initialQuestions[initialQuestions.length - 1]?.question != "" ? (
                          <>
                          <h1 className='mb-5'>โจทย์ ({initialQuestions.length})</h1>
                          <div style={{ display: 'flex', gap: '10px',justifyContent:'center' }}>
                          {initialQuestions.map((exam) => (
                            <button key={exam.exam} onClick={() => openModal(exam)}>
                              {exam.name}
                            </button>
                          ))}
                          </div>
                         
                          </>
                          ) : ("ยังไม่มีโจทย์")}
                          
                        

                        <Modal isOpen={modalIsOpen} onRequestClose={closeModal}
                        overlayClassName={styles.ReactModal__Overlay}
                        className={styles.ReactModal__Content}
                        >
                          <h2 className='mb-3'>{selectedExam?.name}</h2><hr />
                          <p className='mt-3 mb-5'>{selectedExam?.detel}</p><hr />
                          <button className='mt-4 mr-3' onClick={startExam}>เริ่มทำข้อสอบ</button>
                          <button onClick={closeModal}>ปิด</button>
                        </Modal>
                         
                        <br />
                        
                        {/* เพิ่ม score */}
                      
                        <button className='text-lg mt-10 mb-5 hover:text-green-500' onClick={handleSubmit} type="submit">เพิ่ม Score</button>
                        <br />

                        {/* Profile */}
                        <Link className='text-center text-white hover:text-green-500' href={`/room/${id}/profile/${profileNumber}`}>
                          <button>Profile</button>
                        </Link>
                        <br />

                        {/* modal edit name */}
                        {/* เพิ่ม name */}
                        <button onClick={handleEditNickname} className='text-xl mt-5 hover:text-green-500'>
                          แก้ไขชื่อเล่น
                        </button>

                        <NicknameModal
                          show={showModal}
                          onClose={() => setShowModal(false)}
                          onSave={handleSaveNickname}
                          initialNickname={nickname}
                        />
                      </>
                    )}

                    <h1 className="text-3xl mt-10">มีใครบ้าง :</h1>
                    <ul className='mt-3'><li className="text-red-500">{room.userHost} (HOST)</li></ul>
                    {room.users ? (
                      <>
                        <ul className='mb-14'>
                          {room.users.map((user, index) => (
                            <li key={index} className="text-blue-500">{user} ( User )</li>
                          ))}
                        </ul>

                        <div className='text-xl mt-5 mb-10'>
                          <Link href="/room/[id]/leaderboard" as={`/room/${id}/leaderboard`}>
                            Go to Leaderboard
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h1 className='text-3xl mt-5'>  <br />  
                      X ไม่มีห้องเลขนี้ X</h1>
                    <div className='text-xl mt-5'>
                      <Link href="/" >ย้อนกลับไป</Link>
                    </div>
                  </>
                )}
              </>
            ) : (
              <> 
              {email ? (
          <>
        <br />
          <h1 className='text-3xl mt-5'>ไม่อนุญาตให้ตรวจสอบข้อมูลในห้องอื่น ถ้ายังไม่ได้เข้าร่วมห้อง</h1>
          <div className='text-xl mt-5'>
            <Link href="/" >ย้อนกลับไป</Link>
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

  return {
    props: {
      email,
      roomNumber: id, // ส่ง roomNumber ไปด้วย
      users,
      initialQuestions: room.questions || '',
    },
  };
}


export default Room;
