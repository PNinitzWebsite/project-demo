import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout';
import { getCookie } from 'cookies-next';
import Loading from '@/components/Loading'; // นำเข้า component Loading
import clientPromise from '../../../../lib/mongodb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)



// ใช้ require แทน import
const SyntaxHighlighter = require('react-syntax-highlighter').Prism;
const { tomorrow } = require('react-syntax-highlighter/dist/cjs/styles/prism/tomorrow');

const ExamDetailPage = ({ email, users, initialQuestions }) => {
  const router = useRouter();
  const { exam, id } = router.query;
  const [room, setRoom] = useState(null);
  const [host, setHost] = useState(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false); // เพิ่ม state เพื่อเก็บสถานะของการประมวลผล
  const [loading, setLoading] = useState(true); // เพิ่ม state เพื่อเก็บสถานะการโหลด
  const [questions, setQuestions] = useState(initialQuestions || []);

  const handleTab = async (event) => {
    if (event.key === 'Tab' && !event.repeat) {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = event.target;
      const newValue =
        value.substring(0, selectionStart) +
        '\t' +
        value.substring(selectionEnd);
      setCode(newValue);
      // ปรับตำแหน่งเคอร์เซอร์ตามต้องการ
      const newCursorPosition = selectionStart + 1;
      event.target.selectionStart = newCursorPosition;
      event.target.selectionEnd = newCursorPosition;

      // หยุดการกระจายเหตุการณ์ไปยังองค์ประกอบอื่น
      event.stopPropagation();
    }
  };

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
    setProcessing(false); // ตั้งค่าสถานะเป็น false เมื่อการประมวลผลเสร็จสิ้น
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
    router.push({
      pathname: '/room/[id]',
      query: { id: `${id}` }
    });
  };

  const saveQuestion = async (compiledResult) => {
    try {
      const response = await fetch('/api/saveQuestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({ roomId: id, question: compiledResult, exam:questions[parseInt(exam)-1].exam ,name:questions[parseInt(exam)-1].name,detel:questions[parseInt(exam)-1].detel }),
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setQuestions(prevQuestions => [...prevQuestions, { question: compiledResult }]); // เพิ่มคำถามใน state
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกโจทย์');
    }
  };

  return (
    <div
    // กัน กด tab ค้าง
    onKeyDown={(e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
      }
    }}>
      <Layout pageTitle="Welcome">
        {loading ? (
          <Loading />
        ) : (
          <>
            {users && Array.isArray(users) && (users.includes(email) || host === "host") ? (
              <>
                {room ? (
                  <>
                    <div>
                      <button className='text-sm mt-6 mb-6' onClick={handleExit}>Exit</button>
                    </div>

                    {host === "host" ? (
                      // ของ Host
                      <>
                        <center className='text-2xl bg-red-500 text-center uppercase'>Host</center>
                        <h1 className='mt-5'>ข้อสอบ {exam}</h1>

                        <h1 className='mt-10 mb-5 text-2xl'>กรอกโจทย์โค้ด Python หัวข้อ: {questions[parseInt(exam)-1].name}</h1>
        <div style={{ maxWidth:'70dvw',margin:'0 auto', }}>
          <SyntaxHighlighter language="python" style={tomorrow}>
            {code}
          </SyntaxHighlighter>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleTab}
            placeholder="เขียนโค้ดที่นี่..."
            style={{
              width: '100%',color:'black',
              height: '150px',maxWidth:'70dvw',
              borderRadius: '10px',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '16px',
              marginTop: '10px',
            }}
          />
        </div>
       <button className='mt-5 mb-5 block mx-auto hover:text-green-500' onClick={checkSyntax}>คำนวณผลลัพท์เพื่อตั้งโจทย์</button>
 
                        <h1>
                        โจทย์:</h1>

                        {questions[parseInt(exam)-1]?.exam == exam ? (
                          <ul>
                            <li>
                              <p>ข้อสอบ: {questions[parseInt(exam)-1].exam}</p>
                              <p>ชื่อข้อสอบ: {questions[parseInt(exam)-1].name}</p>
                              <p>รายละเอียดข้อสอบ: {questions[parseInt(exam)-1].detel}</p>
                              <p className='text-green-500'>เฉลยข้อสอบ: {questions[parseInt(exam)-1].question ? questions[parseInt(exam)-1].question : "ไม่มีเฉลย"}</p>
                            </li>
                          </ul>
                        ) : (
                          <h1>ยังไม่มีโจทย์</h1>
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
                                <>
                                  <p className='mt-2 text-green-500'>ผลลัพธ์จากการคำนวณหรือการคอมไพล์โจทย์: <br /> {result.compiledResult}</p>
                                  {host === "host" && (
                                    <button className='mt-3' onClick={() => saveQuestion(result.compiledResult)}>
                                      ตั้งค่าผลลัพท์ให้เป็นโจทย์
                                    </button>
                                  )}
    
                                </>
                              )}
                            </div>
                          )
                        )}

                        <br />  <br />  <br />
                      </>
                    ) : (
                      // ของ Client
                      <>
                        <center className='text-2xl bg-yellow-700 text-center uppercase'>Client</center>            
                        <h1 className='mt-10 mb-2 text-2xl'>หัวข้อ : {questions[parseInt(exam)-1].name}</h1>
                        <h1 className='mt-1 mb-5 text-xl'>คำอธิบาย : {questions[parseInt(exam)-1].detel}</h1>
                        
                        <h1 className='mt-10 mb-5 text-2xl'>ตรวจสอบไวยากรณ์ของโค้ด Python</h1>
                        <div style={{ maxWidth:'85dvw',margin:'0 auto', }}>
                        <SyntaxHighlighter language="python" style={tomorrow}>
                          {code}
                        </SyntaxHighlighter>
                        <textarea
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          onKeyDown={handleTab}
                          placeholder="เขียนโค้ดที่นี่..."
                          style={{
                            width: '100%',color:'black',
                            height: '150px',maxWidth:'85dvw',
                            borderRadius: '10px',
                            padding: '10px',
                            fontFamily: 'monospace',
                            fontSize: '16px',
                            marginTop: '10px',
                          }}
                        />
                      </div>
                        <button className='mt-5 mb-5 block mx-auto hover:text-green-500' onClick={checkSyntax}>ตรวจสอบไวยากรณ์</button>

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
                                <>
                                  <p className='mt-2 text-green-500'>ผลลัพธ์จากการคำนวณหรือการคอมไพล์โจทย์: {result.compiledResult}</p>

                                  {result.compiledResult === questions[parseInt(exam)-1].question ? (
                                    <>
                                      <h1 className='mb-10 text-green-300 text-xl'>
                                      <br />
                                      <FontAwesomeIcon icon="fa-solid fa-circle-check" className='w-8 mr-2 inline-table'/>
                                        คำตอบถูกต้อง</h1>
                                    </>
                                  ) : (
                                    <>
                                      {questions[parseInt(exam)-1].question === "" ? <h1 className=' text-red-300 text-xl'>ไม่มีคำโจทย์</h1> :
                                        <h1 className='mb-10 text-red-300 text-xl'>
                                          <br />
                                          <FontAwesomeIcon icon="fa-solid fa-circle-xmark" className='w-8 mr-2 inline-table' />
                                          คำตอบไม่ถูกต้อง</h1>
                                      }
                                    </>)}
                                </>
                              )}
                            </div>
                          )
                        )}

                        <br />
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
  const { id } = context.params;
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
  const questions = room.questions || [];
  return {
    props: {
      email,
      roomNumber: id, // ส่ง roomNumber ไปด้วย
      users,
      initialQuestions: questions,
    },
  };
}

export default ExamDetailPage;
