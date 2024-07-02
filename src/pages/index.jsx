import React, { useState, useEffect , useMemo, useCallback } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import Layout from '../components/layout';
import { getCookie } from 'cookies-next';
import Loading from '../components/Loading';


const Rooms = ({ email }) => {
  const [roomNumber, setRoomNumber] = useState('');
  const [userHostRoomsCount, setUserHostRoomsCount] = useState(0);
  const [userRoomsCount, setUserRoomsCount] = useState(0);
  const [userHostRooms, setUserHostRooms] = useState([]);
  const [userClientRooms, setUserClientRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const roomName = useMemo(() => {
    if (isModalOpen && userHostRoomsCount >= 0) {
      return `ห้อง ${userHostRoomsCount + 1}`;
    }
    return '';
  }, [isModalOpen, userHostRoomsCount]);

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
    setRoomName('');
  };

  
  

  const handleSubmitRoom = async () => {
    try {
      const newRoomNumber = generateRandomRoomNumber();

      const response = await fetch('/api/add-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomNumber: newRoomNumber, userHost: email, roomName: roomName,roomPass:roomPass }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`สร้างห้อง ${data.roomNumber} สำเร็จ | ชื่อห้อง : ${data.roomName} | รหัสผ่าน : ${data.roomPass}`);
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
        

          <br />
          {userRoomsCount < 8 ?(
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
    <h2 className='text-xl mt-10'>คุณเข้าร่วม {userRoomsCount}/8 ห้อง</h2>
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
