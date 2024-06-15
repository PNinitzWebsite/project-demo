import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout';
import { getCookie } from 'cookies-next';
import styles from '../../components/style.module.css'; // นำเข้า CSS ไฟล์
import NicknameModal from '@/components/NicknameModal';

const Room = ({ email }) => {
  const router = useRouter();
  const { id } = router.query;
  const [room, setRoom] = useState(null);
  const [host, setHost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [profileNumber, setProfileNumber] = useState(null);

  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false); // เพิ่ม state เพื่อเก็บสถานะของการประมวลผล

  const checkSyntax = async () => {
    setProcessing(true); // ตั้งค่าสถานะเป็น true เมื่อเริ่มการประมวลผล
    const response = await fetch('/api/checkSyntax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    setResult(data);
    setProcessing(false); // ตั้งค่าสถานะเป็น false เมื่อการประมวลผลเสร็จสมบูรณ์
  };

  useEffect(() => {
    if (id) {
      fetch(`/api/room/${id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Room not found');
          }
          return res.json();
        })
        .then((data) => {
          setRoom(data.room);
          if (email === data.room.userHost) {
            setHost("host");
            // console.log('Host', data.room.userHost);
          }else {
            // console.log('Client', email);
            // console.log('test :',data.room.users);
            const index = data.room.users.findIndex(user => user === email);
            // console.log(`Index of ${email}`, index);
            setProfileNumber(index + 1);
          }
        })
        .catch((error) => {
          console.error('Error fetching room:', error);
          // Handle error, such as redirecting to room selection page
        });
    }


  }, [id,email]);

  const handleExit = () => {
    // Redirect to another page
    router.push('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newScore = prompt(`กรุณาใส่คะแนนที่ต้องการเพิ่ม ของอีเมล ${email}`, "100"); // ใช้ prompt ในการรับคะแนนที่ต้องการเพิ่ม
    const response = await fetch(`/api/add-score?roomNumber=${room.roomNumber}&email=${email}&score=${newScore}`, {
      method: 'GET',
    });
    const data = await response.json();
    // console.log(data);
    alert(`เพิ่มข้อมูล ${email} สำเร็จแล้ว`); // แจ้งเตือนว่าเพิ่มข้อมูลสำเร็จ
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

  return (
    <div>
      <Layout pageTitle="Welcome">
        {email ? (
          <>
            {room ? (
              <>
                <div>
                  <button className='text-sm mt-6 mb-6' onClick={handleExit}>Exit Room</button>
                </div>
                {host == "host"?(
                  // ของ Host
                  <>
                  <center className='text-2xl bg-red-500 text-center uppercase'>Host</center>
                  <h1 className="text-3xl mt-10">ชื่อห้อง :<span className='text-white'> {room.roomName}</span> </h1>
                  <h1 className="text-3xl mt-10">Welcome <span className={styles.greenText}>{email}</span> to Room
                  <span className={styles.yellowText}> {room.roomNumber}</span></h1></>
                ):( 
                  // ของ Client
                  <>
                  <center className='text-2xl bg-yellow-700 text-center uppercase'>Client</center>
                  <h1 className="text-3xl mt-10">ชื่อห้อง :<span className='text-white'> {room.roomName}</span> </h1>
                  <h1 className="text-3xl mt-10">Welcome <span className={styles.greenText}>{email}</span> to Room
                  <span className={styles.yellowText}> {room.roomNumber}</span></h1>

                  <h1 className='mt-10 mb-5 text-2xl'>ตรวจสอบไวยากรณ์ของโค้ด Python</h1>
                  <textarea className='text-black text-lg'
                            rows="10"
                            cols="50"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                  ></textarea>
                  <button className='mt-5 mb-5 block mx-auto hover:text-green-500' onClick={checkSyntax}>ตรวจสอบไวยากรณ์</button>

                  {/* เพิ่ม score */}
                   <div className='text-xl mt-5 mb-10 hover:text-green-500'>
                    <form onSubmit={handleSubmit}>
                      <button type="submit">เพิ่ม Score</button>
                    </form>
                  </div>

                  {/* Profile */}
                 
                  <Link className='text-center text-white hover:text-green-500' href={`/room/${id}/profile/${profileNumber}`}>
                  <button>Profile</button>
                  </Link>
                  <br />
                 
                    {/* modal edit name */}
                    {/* เพิ่ม name */}
                    <button onClick={handleEditNickname} className='text-xl mt-5 mb-10 hover:text-green-500'>
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
                

                {processing ? (
                  <p>กรุณารอคำนวณสักครู่...</p>
                ) : (
                  result && (
                    <div>
                      <h2>ผลลัพธ์:</h2>
                      {result.success ? (
                        <p>{result.message}</p>
                      ) : (
                        <p className='text-red-500'>{result.error}</p>
                      )}
                      {result.compiledResult && (
                        <p className='mt-2 text-green-500'>ผลลัพธ์จากการคำนวณหรือการคอมไพล์: <br/> {result.compiledResult}</p>
                      )}
                    </div>
                  )
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
          ):(
          <>
          
          </>
          )}
    

          
        </>
      ) : (
        <>
        
        <h1 className='text-3xl mt-5'>  <br></br>  
          X ไม่มีห้องเลขนี้ X</h1>
          <div className='text-xl mt-5'>
            <Link href="/" >ย้อนกลับไป</Link>
          </div>
          
        </>
        
      )}
     </>
      
      
    ) : (
      <> <br/>
      <h1 className='text-3xl mt-5'>ยังไม่ได้เข้าสู่ระบบ</h1>
      <div className='text-xl mt-5'>
            <Link href="/" >ย้อนกลับไป</Link>
          </div>
       </>
    )}
    
    
      
      </Layout>
    </div>
  );
};

export async function getServerSideProps(context) {
  const req = context.req
  const res = context.res
  var email = getCookie('email', { req, res });
  if (email == undefined){
    email = false;
  }
  return { props: {email} };
};

export default Room;
