import React, { useState, useEffect , useCallback } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import Layout from '../components/layout';
import { getCookie } from 'cookies-next';
import Loading from '../components/Loading';


const Rooms = ({ email }) => {
  const [roomNumber, setRoomNumber] = useState('');
  const [hostName, setHostName] = useState('');
  const [userHostRoomsCount, setUserHostRoomsCount] = useState(0);
  const [userRoomsCount, setUserRoomsCount] = useState(0);
  const [userHostRooms, setUserHostRooms] = useState([]);
  const [userClientRooms, setUserClientRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState('');

  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
  const [isModalOpenLeave, setIsModalOpenLeave] = useState(false);
  const [isModalOpenCopy, setIsModalOpenCopy] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');

  const handleOpenModalDelete = () => {
    setIsModalOpenDelete(true);
  };
  
  const handleCloseModalDelete = () => {
    setIsModalOpenDelete(false);
  };

  const handleOpenModalLeave = () => {
    setIsModalOpenLeave(true);
  };
  
  const handleCloseModalLeave = () => {
    setIsModalOpenLeave(false);
  };

  const handleOpenModalCopy = () => {
    setIsModalOpenCopy(true);
  };
  
  const handleCloseModalCopy = () => {
    setIsModalOpenCopy(false);
  };

  useEffect(() => {
    if (isModalOpen && userHostRoomsCount >= 0) {
      setRoomName(`ห้อง ${userHostRoomsCount + 1}`);
    } else {
      setRoomName('');
    }
  }, [isModalOpen, userHostRoomsCount]);

  const deleteRoom = async () => {
    try {
      const response = await fetch('/api/delete-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomNumber: selectedRoom }),
      });
  
      if (response.ok) {
        alert(`ห้อง ${selectedRoom} ถูกลบเรียบร้อยแล้ว`);
        fetchData(); // Refresh the data after deleting the room
        handleCloseModalDelete();
      } else {
        console.error('Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };
  
  const removeUserFromRoom = async () => {
    try {
      const response = await fetch('/api/remove-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomNumber:selectedRoom, userEmail: email }),
      });
  
      if (response.ok) {
        alert(`ผู้ใช้ ${email} ถูกลบออกจากห้อง ${selectedRoom} เรียบร้อยแล้ว`);
        fetchData(); // Refresh the data after deleting the room
        handleCloseModalLeave();
      } else {
        console.error('Failed to remove user from room');
      }
    } catch (error) {
      console.error('Error removing user from room:', error);
    }
  };

  const copyRoom = async () => {
    try {
      const response = await fetch('/api/copy-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalRoomNumber:selectedRoom, userHost:email }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`ได้คัดลอกห้อง ${selectedRoom} เรียบร้อยแล้ว | ห้องใหม่ : ${data.newRoomNumber}`);
        fetchData(); // Refresh the data after deleting the room
        handleCloseModalCopy();
      } else {
        console.error('Failed to remove user from room');
        alert(`ไม่สามารถคัดลอกห้องได้: ${data.message}`);
      }
    } catch (error) {
      console.error('Error removing user from room:', error);
      alert('เกิดข้อผิดพลาดในการคัดลอกห้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [responseHost, responseClient] = await Promise.all([
        fetch(`/api/get-rooms?userHost=${email}`),
        fetch(`/api/get-rooms?users=${email}`)
      ]);

      if (responseHost.ok && responseClient.ok) {
        const [dataHost, dataClient] = await Promise.all([
          responseHost.json(),
          responseClient.json()
        ]);

        setUserHostRooms(dataHost.rooms);
        setUserHostRoomsCount(dataHost.count);
        setUserClientRooms(dataClient.clientRooms);
        setUserRoomsCount(dataClient.clientRoomsCount);
      } else {
        console.error('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (email) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [email, fetchData]);

  const handleJoinRoom = async () => {
    setError(null); // Reset error state
    if (/^\d{5}$/.test(roomNumber)) {
      try {
        const response = await fetch(`/api/join-room`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomNumber, email }),
        });

        const result = await response.json();
        if (response.ok) {
          Router.push(`/room/${roomNumber}`);
        } else {
          setError(result.error); // Set error message
          // console.error('Failed to join room');
        }
      } catch (error) {
        console.error('Error joining room:', error);
        setError('Error joining room. Please try again.'); // Set generic error message
      }
    } else {
      setError('Please enter a 5-digit room number');
    }
  };

  const handleAddRoom = async () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitRoom = async () => {
    try {
      if(isModalOpen && hostName.length <= 0){
        setHostName("Admin");
      }
      
      const newRoomNumber = generateRandomRoomNumber();

      const response = await fetch('/api/add-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomNumber: newRoomNumber, userHost: email, roomName: roomName, hostName:hostName }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`สร้างห้อง ${data.roomNumber} สำเร็จ | ชื่อเล่น : ${data.hostName} | ชื่อห้อง : ${data.roomName}`);
        Router.push(`/room/${data.roomNumber}`);
      } else {
        console.error('Failed to add room');
      }
    } catch (error) {
      console.error('Error adding room:', error);
    } finally {
      handleCloseModal();
    }
  };

  const generateRandomRoomNumber = () => {
    return Math.floor(10000 + Math.random() * 90000);
  };

  return (
    <Layout pageTitle="Rooms">
      {loading ?(
        <Loading/>
      ):(
        <>
        {email ? (
        <div className='mt-6'>
          <Link href="/api/logout">
            <button class="mx-auto btn-logout">
              <div class="sign-logout"><svg viewBox="0 0 512 512"><path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path></svg></div>
              <div class="text-logout">Logout</div>
            </button>
          </Link>
        {/* ลบห้อง */}
          {isModalOpenDelete && userHostRooms.length > 0 && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h1 className="text-lg text-black font-bold mb-4">เลือกห้องเพื่อลบ</h1>
      <select
        value={selectedRoom}
        onChange={(e) => setSelectedRoom(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกห้อง</option>
        {userHostRooms.map(room => (
          <option key={room._id} value={room.roomNumber}>
            {`${room.roomName} (${room.roomNumber})` || `ห้อง ${room.roomNumber}`}
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
          onClick={deleteRoom}
          disabled={!selectedRoom}
        >
          ลบห้อง
        </button>
      </div>
    </div>
  </div>
)}
{/* ออกห้อง */}
{isModalOpenLeave && userClientRooms.length > 0 && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h1 className="text-lg text-black font-bold mb-4">เลือกห้องเพื่อออกจากห้อง</h1>
      <select
        value={selectedRoom}
        onChange={(e) => setSelectedRoom(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกห้อง</option>
        {userClientRooms.map(room => (
          <option key={room._id} value={room.roomNumber}>
            {`${room.roomName} (${room.roomNumber})` || `ห้อง ${room.roomNumber}`}
          </option>
        ))}
      </select>

      <div className="flex justify-end">
        <button
          className="mr-4 btn-gray"
          onClick={handleCloseModalLeave}
        >
          ยกเลิก
        </button>
        <button
          className="btn-error"
          onClick={removeUserFromRoom}
          disabled={!selectedRoom}
        >
          ออกห้องเรียน
        </button>
      </div>
    </div>
  </div>
)}
{/* คัดลอกห้องเรียน */}
{isModalOpenCopy && userHostRooms.length > 0 && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h1 className="text-lg text-black font-bold mb-4">เลือกห้องเพื่อคัดลอกห้อง</h1>
      <select
        value={selectedRoom}
        onChange={(e) => setSelectedRoom(e.target.value)}
        className="border text-black bg-white border-gray-300 rounded px-4 py-2 w-full mb-4"
      >
        <option value="">เลือกห้อง</option>
        {userHostRooms.map(room => (
          <option key={room._id} value={room.roomNumber}>
            {`${room.roomName} (${room.roomNumber})` || `ห้อง ${room.roomNumber}`}
          </option>
        ))}
      </select>

      <div className="flex justify-end">
        <button
          className="mr-4 btn-gray"
          onClick={handleCloseModalCopy}
        >
          ยกเลิก
        </button>
        <button
          className="btn-alert"
          onClick={copyRoom}
          disabled={!selectedRoom}
        >
          คัดลอกห้อง
        </button>
      </div>
    </div>
  </div>
)}
      
          {userRoomsCount < 12 ?(
            <>
             <h1 className='text-2xl mt-6'>Join a Room</h1>
          <input className="input text-xl mr-3 mt-3"
            type="text"
            value={roomNumber}
            onChange={(e) => {
              const inputText = e.target.value.replace(/\D/g, ''); // จำกัดให้กรอกได้เฉพาะตัวเลข
              const limitedText = inputText.slice(0, 5); // จำกัดให้กรอกได้แค่ 5 ตัวเลข
              setRoomNumber(limitedText);
            }}
            placeholder="Enter 5-digit room"
          />

          <button className="btn-primary mt-4" onClick={handleJoinRoom}>เข้าร่วมห้อง</button>

          {error && <p className="error-text mt-2">{error}</p>}

            </>
          ):(
            <>
            <h1 className='text-2xl mt-10'>Choose a Room</h1>

            <button disabled className=' btn-gray mt-4' onClick={handleJoinRoom}>เข้าร่วมห้องไม่ได้แล้ว</button>
            </>
          )}

          {userRoomsCount > 0 ? (
  <>
    <h2 className='text-xl mt-10'>คุณเข้าร่วม {userRoomsCount}/12 ห้อง</h2>
    <button className="mt-4 btn-error" onClick={handleOpenModalLeave}>ออกห้อง</button>
    <div className="flex flex-wrap justify-stretch mt-4">
      {userClientRooms.map(room => (
        <div key={room._id} className="w-1/4 p-2">
          <Link href={`/room/${room.roomNumber}`}>
            <button className="btn-primary mt-4">{room.roomName} <br />{room.roomNumber}</button>
         </Link>
        </div>
      ))}
    </div>

  </>
) : (
  <><h2 className='text-xl mt-6'>คุณไม่ได้เข้าร่วมห้องใด ๆ</h2></>
)}

          <br />
          {userHostRoomsCount < 12 ?(
            <>
             <h1 className='text-2xl'>Add a New Room</h1>
          <button className='btn-secondary mt-4' onClick={handleAddRoom}>เพิ่มห้อง</button>
            </>
          ):(
            <>
            <h1 className='text-2xl'>Add a New Room</h1>
            <button disabled className=' btn-gray mt-4' onClick={handleAddRoom}>เพิ่มห้องไม่ได้แล้ว</button>
            </>
          )}
         
         {userHostRoomsCount > 0 ? (
  <>
    <h2 className='text-2xl mt-10'>คุณมี {userHostRoomsCount}/12 ห้อง</h2>
    <button className="mt-4 mr-4 btn-alert" onClick={handleOpenModalCopy}>คัดลอกห้อง</button>
    <button className="mt-4 btn-error" onClick={handleOpenModalDelete}>ลบห้อง</button>

    <div className="flex flex-wrap justify-stretch mt-4">
  {userHostRooms.map(room => (
    <div key={room._id} className="w-1/4  p-2">
      <Link href={`/room/${room.roomNumber}`}>
      <button className="btn-secondary mt-4">{room.roomName} <br />{room.roomNumber}</button>
      </Link>
    </div>
  ))}
</div>

  </>
) : (
  <><h2 className='text-xl mt-6 '>ไม่มีห้อง 0/12</h2></>
)}


          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-container">
              <h1 className="text-lg text-black font-bold mb-4">กรอกชื่อเล่น</h1>
<input required
  type="text"
  value={hostName}
  onChange={(e) => {
    const inputText = e.target.value;
    if (inputText.length <= 20) {
      setHostName(inputText);
    } else {
      alert('ชื่อเล่นต้องมีไม่เกิน 20 ตัวอักษร');
    }
  }}
  onBlur={(e) => {
    const inputText = e.target.value.trim();
    if (inputText.length === 0) {
      setHostName(`Admin`);
    }
  }}
  className="input mb-4"
  placeholder="Host Name (max 20 characters)"
/>

<h1 className="text-lg text-black font-bold mb-4">กรอกชื่อห้อง</h1>
<input
  type="text"
  value={roomName}
  onChange={(e) => {
    const inputText = e.target.value;
    if (inputText.length <= 20) {
      setRoomName(inputText);
    } else {
      alert('ชื่อห้องต้องมีไม่เกิน 20 ตัวอักษร');
    }
  }}
  onBlur={(e) => {
    const inputText = e.target.value.trim();
    if (inputText.length === 0) {
      setRoomName(`ห้อง ${userHostRoomsCount + 1}`);
    }
  }}
  className="input mb-4"
  placeholder="Room Name (max 20 characters)"
/>


                <div className="flex justify-end">
                <button className="mr-4 btn-gray" onClick={handleCloseModal}>ยกเลิก</button>
                <button className="btn-secondary" onClick={handleSubmitRoom}>สร้างห้อง</button>
                </div>
              </div>
            </div>
          )}

<br /><br />
        </div>
      ) : (
        <div className="flex flex-col items-center mt-10">
        
          <h1 className='text-2xl mt-10'>Please Log in to Access Rooms</h1>
     
          <button className='mt-5 btn-primary'><Link href="/login">Login</Link></button>
       
          <button className='mt-5 btn-secondary'><Link href="/signup">Signup</Link></button>
          
        </div>
      )}
        </>
      )}
      
      
    </Layout>
  );
};

export async function getServerSideProps(context) {
  
  const req = context.req;
  const res = context.res;
  var email = getCookie('email', { req, res });
  // check 404 page
  // if (email) {
  //   return {
  //     notFound: true,
  //   };
  // }
  if (!email) {
    email = null; // หรือ undefined ตามที่คุณต้องการ
  }
  return { props: { email } };

  
}

export default Rooms;
