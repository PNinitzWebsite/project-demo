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
        </>
      )}
      {email ? (
        <div className='mt-10'>
       
          <Link className='text-red-500 hover:text-red-800' href="/api/logout">Logout</Link>
        {/* ลบห้อง */}
          {isModalOpenDelete && userHostRooms.length > 0 && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg">
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
          className="mr-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 border-gray-600 hover:border-gray-800"
          onClick={handleCloseModalDelete}
        >
          ยกเลิก
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800 border-red-500 hover:border-red-700"
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
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg">
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
          className="mr-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 border-gray-600 hover:border-gray-800"
          onClick={handleCloseModalLeave}
        >
          ยกเลิก
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800 border-red-500 hover:border-red-700"
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
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg">
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
          className="mr-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 border-gray-600 hover:border-gray-800"
          onClick={handleCloseModalCopy}
        >
          ยกเลิก
        </button>
        <button
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-800 border-yellow-500 hover:border-yellow-700"
          onClick={copyRoom}
          disabled={!selectedRoom}
        >
          คัดลอกห้อง
        </button>
      </div>
    </div>
  </div>
)}


          <br />
          {userRoomsCount < 12 ?(
            <>
             <h1 className='text-2xl mt-10'>Choose a Room</h1>
          <input className="text-xl mr-3 mt-3"
            type="text"
            value={roomNumber}
            onChange={(e) => {
              const inputText = e.target.value.replace(/\D/g, ''); // จำกัดให้กรอกได้เฉพาะตัวเลข
              const limitedText = inputText.slice(0, 5); // จำกัดให้กรอกได้แค่ 5 ตัวเลข
              setRoomNumber(limitedText);
            }}
            placeholder="Enter 5-digit room"
          />

          <button onClick={handleJoinRoom}>เข้าร่วมห้อง</button>

          {error && <p className="text-red-500">{error}</p>}

            </>
          ):(
            <>
            <h1 className='text-2xl mt-10'>Choose a Room</h1>

            <button disabled className=' text-gray-400 mt-4 border-red-600 hover:border-red-800' onClick={handleJoinRoom}>เข้าร่วมห้องไม่ได้แล้ว</button>
            </>
          )}

          {userRoomsCount > 0 ? (
  <>
    <h2 className='text-xl mt-10'>คุณเข้าร่วม {userRoomsCount}/12 ห้อง</h2>
    <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800 border-red-500 hover:border-red-700" onClick={handleOpenModalLeave}>ออกห้อง</button>
    <div className="flex flex-wrap justify-stretch mt-4">
      {userClientRooms.map(room => (
        <div key={room._id} className="w-1/4 p-2">
          <Link href={`/room/${room.roomNumber}`}>
            <button className="mt-4">
              {room.roomName} <br />
              {room.roomNumber}
            </button> 
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
          <button className='mt-4' onClick={handleAddRoom}>เพิ่มห้อง</button>
            </>
          ):(
            <>
            <h1 className='text-2xl'>Add a New Room</h1>
            <button disabled className=' text-gray-400 mt-4 border-red-600 hover:border-red-800' onClick={handleAddRoom}>เพิ่มห้องไม่ได้แล้ว</button>
            </>
          )}
         
         {userHostRoomsCount > 0 ? (
  <>
    <h2 className='text-2xl mt-10'>คุณมี {userHostRoomsCount}/12 ห้อง</h2>
    <button className="mt-4 mr-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-800 border-yellow-500 hover:border-yellow-700" onClick={handleOpenModalCopy}>คัดลอกห้อง</button>
    <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800 border-red-500 hover:border-red-700" onClick={handleOpenModalDelete}>ลบห้อง</button>

    <div className="flex flex-wrap justify-stretch mt-4">
  {userHostRooms.map(room => (
    <div key={room._id} className="w-1/4  p-2">
      <Link href={`/room/${room.roomNumber}`}>
        <button className="mt-4">
          {room.roomName} <br />
          {room.roomNumber}
        </button> 
      </Link>
    </div>
  ))}
</div>

  </>
) : (
  <><h2 className='text-xl mt-6 '>ไม่มีห้อง 0/12</h2></>
)}


          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-8 rounded-lg">
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
  className="border text-black bg-black border-gray-300 rounded px-4 py-2 w-full mb-4"
  placeholder="ชื่อเล่น เช่น Admin"
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
  className="border text-black bg-black border-gray-300 rounded px-4 py-2 w-full mb-4"
  placeholder="ชื่อห้อง เช่น ห้องที่ 1"
/>


                <div className="flex justify-end">
                  <button className="mr-4 bg-gray-700 px-4 py-2 rounded hover:bg-red-800" onClick={handleCloseModal}>ยกเลิก</button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800" onClick={handleSubmitRoom}>สร้างห้อง</button>
                </div>
              </div>
            </div>
          )}

<br /><br />
        </div>
      ) : (
        <div>
          <br />
          <h1 className='text-2xl mt-10'>Please Log in to Access Rooms</h1>
          <br />
          <button className='mt-5'><Link href="/login">Login</Link></button>
          <br />
          <button className='mt-5'><Link href="/signup">Signup</Link></button>
          
        </div>
      )}
      
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const req = context.req;
  const res = context.res;
  var email = getCookie('email', { req, res });
  if (!email) {
    email = null; // หรือ undefined ตามที่คุณต้องการ
  }
  return { props: { email } };
}

export default Rooms;
