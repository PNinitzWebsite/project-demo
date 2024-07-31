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

const ExamDetailPage = ({ email, users, initialQuestions,hostAdmin }) => {
  const router = useRouter();
  const { exam, id } = router.query;
  const [room, setRoom] = useState(null);
  const [host, setHost] = useState('');
  const [code, setCode] = useState('');
  const [testCases, setTestCases] = useState('');
  const [expectedResults, setExpectedResults] = useState('');
  const [result, setResult] = useState(null);
  const [fresult, setFresult] = useState(null);
  const [close, setClose] = useState(false); 
  const [processing, setProcessing] = useState(false); // เพิ่ม state เพื่อเก็บสถานะของการประมวลผล
  const [loading, setLoading] = useState(true); // เพิ่ม state เพื่อเก็บสถานะการโหลด
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [variableCheckResult, setVariableCheckResult] = useState({});
  const [point, setPoint] = useState('');
  const [pointCount, setPointCount] = useState('');
  
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [variableScores, setVariableScores] = useState({});
  useEffect(() => {
    if (fresult) {
      setVariableScores(
        (fresult || []).reduce((acc, _, index) => {
          const varName = `TestCase${index + 1}`;
          acc[varName] = 1; // กำหนดคะแนนเริ่มต้นเป็น 1
          return acc;
        }, {})
      );
    }
  }, [fresult]);

  useEffect(() => {
    if (questions.length && fresult) {
      const examIndex = parseInt(exam) - 1;
      const initialVariableScores = questions[examIndex]?.variableScores || {};
      setVariableScores(prevScores => ({
        ...prevScores,
        ...initialVariableScores
      }));
    }
  }, [questions, exam, fresult]);
  

  const updateVariableScore = (varName, newValue) => {
    setVariableScores(prevScores => ({
      ...prevScores,
      [varName]: newValue
    }));
  };

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
  
      } catch (error) {
        console.error('Error fetching room:', error);
      } finally {
        if (email === hostAdmin) {
          setHost("host");
          setLoading(false);
        }else{
          setHost("client");
          setLoading(false);
        }
      }
    };
  
    fetchRoomData();
  }, [id, email]);
  

  useEffect(() => {
    const checkSubmittedAnswer = async () => {
      try {
        const response = await fetch(`/api/checkSubmittedAnswer?roomId=${id}&examId=${exam}&email=${email}`);
        const data = await response.json();
        if (data.submitted) {
          setAnswerSubmitted(true);
          setPoint(`คุณทำถูก: ${data.correctCount}/${data.totalQuestions} ข้อ`);
          setPointCount(`คะแนนของคุณ: ${data.score}/${data.maxScore} คะแนน`);
        }
      } catch (error) {
        console.error('Error checking submitted answer:', error);
      }
    }; 
  
    if(id && exam && email && host !== "host"){
      checkSubmittedAnswer();
    }
  }, [email, id, exam, host]);


  const submitAnswer = async () => {
    if (!fresult) {
      alert('กรุณาตรวจสอบโค้ดของคุณก่อนส่งคำตอบ');
      return;
    }
    // console.log("คำตอบ",fresult)
    
    setProcessing(true);
    try {
      const response = await fetch('/api/submitAnswer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          roomId: id, 
          examId: exam, 
          email: email, 
          answer: fresult,
          code: code
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        setAnswerSubmitted(true);
        alert('ส่งคำตอบเรียบร้อยแล้ว');
        setPoint(`คุณทำถูก: ${data.correctCount}/${data.totalQuestions} ข้อ`);
        setPointCount(`คะแนนของคุณ: ${data.score}/${data.totalScore} คะแนน`);
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการส่งคำตอบ');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำตอบ');
    } finally {
      setProcessing(false);
    }
  };

  const checkCode = async () => {
    if (!code.trim()) {
        setResult({ success: false, error: 'กรุณากรอกโค้ด' });
        return;
    }

    let resolvedTestCases = [];
    let resolvedExpectedResults = [];
  
    if (host === "host") {
      // แปลงค่า testCases และ expectedResults จากข้อความให้เป็นอาร์เรย์
      resolvedTestCases = testCases.split('\n').map(line => line.trim()).filter(line => line);
      resolvedExpectedResults = expectedResults.split('\n').map(value => value.trim()).filter(value => value);
  
      if (resolvedTestCases.length === 0 || resolvedExpectedResults.length === 0) {
        setResult({ success: false, error: 'กรุณากรอก test_cases และ expected_results' });
        return;
      }
    } else {
      resolvedTestCases = questions[parseInt(exam) - 1].testCase.split('\n').map(line => line.trim()).filter(line => line);
      resolvedExpectedResults = questions[parseInt(exam) - 1].expectedResults.split('\n').map(value => value.trim()).filter(value => value);
    }

    setProcessing(true);

    try {
        // console.log({
        //     code,
        //     test_cases: resolvedTestCases,
        //     expected_results: resolvedExpectedResults
        // });

        const response = await fetch('/api/checkCode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                test_cases: resolvedTestCases,
                expected_results: resolvedExpectedResults
            }),
        });

        const data = await response.json();
        setResult(data);
        setFresult(data.results || []);
        setProcessing(false);
        setAnswerSubmitted(false);

        if (data.success && data.results) {
            setVariableCheckResult(data.results);
        } else {
            setVariableCheckResult({});
        }

    } catch (error) {
        setResult({ success: false, error: 'เกิดข้อผิดพลาดในการดำเนินการ' });
        setProcessing(false);
    }
};





  
  
  const handleExit = () => {
    // Redirect to another page
    router.push({
      pathname: '/room/[id]',
      query: { id: `${id}` }
    });
  };

  const handleCode = async () => {
    setProcessing(true);
  try {
   if(!questions[parseInt(exam)-1].code || !questions[parseInt(exam)-1].testCase || !questions[parseInt(exam)-1].expectedResults){
    alert('ไม่มีสามารถดึงโจทย์ได้');
   }else{
    setCode(questions[parseInt(exam)-1].code);
    setTestCases(questions[parseInt(exam)-1].testCase)
    setExpectedResults(questions[parseInt(exam)-1].expectedResults)
   }

  } catch (error) {
    console.error('Error:', error);
    alert('เกิดข้อผิดพลาดในดึงโค้ด');
  } finally {
    setProcessing(false);
  }
};

// บันทึกโจทย์
const saveQuestion = async (compiledResult, variableScores) => {
  // if (compiledResult && variableScores) {
  //   console.log("testCase:", testCases);
  //   console.log("Variable Scores:", variableScores);
  // }
  try {
    const response = await fetch('/api/saveQuestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        roomId: id,
        testCases,
        expectedResults,
        exam: questions[parseInt(exam)-1].exam,
        variableScores: variableScores
      }),
    });
    
    const data = await response.json();
    if (response.ok) {
      alert(data.message);  
      setVariableScores(variableScores);
      setClose(true);
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
            {users && users.includes(email) || host === "host" ? (
              <>
                {room ? (
                  <>
                    <div>
                      <button className='text-sm mt-6 mb-6' onClick={handleExit}>Exit</button>
                    </div>

                    {host == "host" ? (
                      // ของ Host
                      <>
                        <center className='text-2xl bg-red-500 text-center uppercase'>Host</center>
                        <h1 className='mt-5'>โจทย์ {exam}</h1>

                        <h1 className='mt-10 mb-5 text-2xl'>กรอกโจทย์โค้ด Python หัวข้อ: {initialQuestions[parseInt(exam)-1].name}</h1>
                        <div>
                        <button className='text-sm mt-2 mb-6' onClick={handleCode}>ดึงโจทย์เก่า</button>
                        </div>

                        <textarea
  value={testCases}
  onChange={(e) => setTestCases(e.target.value)}
  placeholder="กรอก testCases ที่นี่ (แยกด้วยบรรทัดใหม่) เช่น testCase(true,false) ขึ้นบรรทัดใหม่ testCase(false,false)"
  style={{
    width: '100%',
    color: 'black',
    height: '7rem',
    maxWidth: '70dvw',
    borderRadius: '10px',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '16px',
    marginTop: '10px',
  }}
/>

<textarea
  value={expectedResults}
  onChange={(e) => setExpectedResults(e.target.value)}
  placeholder="กรอก expectedResults ที่นี่ (แยกด้วยบรรทัดใหม่) เช่น true ขึ้นบรรทัดใหม่ false"
  style={{
    width: '100%',
    color: 'black',
    height: '7rem',
    maxWidth: '70dvw',
    borderRadius: '10px',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '16px',
    marginTop: '10px',
  }}
/>
     <div style={{ maxWidth: '70dvw', margin: '0 auto' }}>
      <SyntaxHighlighter language="python" style={tomorrow}>
        {code}
      </SyntaxHighlighter>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleTab}
        placeholder="เขียนโค้ดที่นี่..."
        style={{
          width: '100%',
          color: 'black',
          height: '15rem',
          maxWidth: '70dvw',
          borderRadius: '10px',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '16px',
          marginTop: '10px',
        }}
      />
      <button className='mt-5 mb-5 block mx-auto hover:text-green-500' onClick={checkCode} disabled={processing}>
        คำนวณผลลัพท์เพื่อตั้งโจทย์
      </button>
 </div>
 

                        {questions[parseInt(exam)-1]?.exam == exam ? (
                          <ul>
                            <li>
                              <p>โจทย์: {questions[parseInt(exam)-1].exam}</p>
                              <p>ชื่อโจทย์: {questions[parseInt(exam)-1].name}</p>
                              <p>รายละเอียดโจทย์: {questions[parseInt(exam)-1].detel}</p>
                              <pre className='text-green-500'>เฉลยโจทย์: {questions[parseInt(exam)-1].code ? questions[parseInt(exam)-1].code : "ไม่มีเฉลย"}</pre>
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
                              {result.success ? (
                                <p>{result.message}</p>
                              ) : (
                                <p className='text-red-500'>{result.error}</p>
                              )}
                              {Array.isArray(fresult) === "reset" ? <p className='text-xl text-green-500'>อัพเดทคะแนนสำเร็จแล้ว!</p> :""}
                              {Array.isArray(fresult) ? <>
                                <h1 className='mt-5 mb-1 text-xl'>ผลลัพธ์จากการคำนวณหรือการคอมไพล์โจทย์ (ล่าสุด):</h1>
    {fresult.map((result, index) => (
       <div key={index} style={{ marginBottom: '10px' }}>
       <p><strong>Test Case: </strong> {result.test_case}</p>
       <p>
           <strong>Expected Result: </strong> 
           <span className={result.correct ? 'text-green-500' : 'text-red-500'}>
               {result.expected}
           </span>
       </p>
       <p>
           <strong>Your Result: </strong> 
           <span className={result.correct ? 'text-green-500' : 'text-red-500'}>
               {result.your_result}
           </span>
       </p>
       <p>
           <strong>Correct: </strong> 
           <span className={result.correct ? 'text-green-500' : 'text-red-500'}>
               {result.correct ? 'Yes' : 'No'}
           </span>
       </p>
   </div>
    ))}
  <h1 className='mt-5 mb-1 text-xl'>ตั้งค่าคะแนนสำหรับแต่ละตัวแปร:</h1>
      {fresult.map((result, index) => {
        const varName = `TestCase${index + 1}`;
        return (
          <div key={varName} className="mb-2">
            <label htmlFor={`score-${varName}`} className="mr-2">Test Case {index + 1}:</label>
            <input required
              type="number"
              id={`score-${varName}`}
              value={variableScores[varName] !== undefined ? variableScores[varName] : 1}
              onChange={(e) => {
                const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
                updateVariableScore(varName, newValue);
              }}
              min="0"
              className="w-16 px-2 py-1 text-black"
            />
          </div>
        );
      })}
      <button
        className='mt-3' 
        onClick={() => {
          saveQuestion(fresult, variableScores);
        }}
      >
        ตั้งค่าผลลัพธ์และคะแนนเป็นโจทย์
      </button>
                              </>:<></>}
                            
                            </div>
                          )
                        )}

                        <br />  <br />  <br />
                      </>
                    ) : (
                      // ของ Client
                      <>
                      {initialQuestions[parseInt(exam)-1]?.isUse === true ? 
                      <>
                      <center className='text-2xl bg-yellow-700 text-center uppercase'>Client</center>            
                        <h1 className='mt-10 mb-2 text-2xl'>หัวข้อ : {questions[parseInt(exam)-1].name}</h1>
                        <h1 className='mt-1 mb-5 text-xl'>คำอธิบาย : {questions[parseInt(exam)-1].detel}</h1>
                        
                        <h1 className='mt-10 mb-5 text-2xl'>ตรวจสอบไวยากรณ์ของโค้ด Python</h1>
                        <div style={{ maxWidth:'85dvw',margin:'0 auto', }}>
                        <SyntaxHighlighter language="python" style={tomorrow} disabled={answerSubmitted}>
                          {code}
                        </SyntaxHighlighter>
                        <textarea 
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          onKeyDown={handleTab}
                          placeholder="เขียนโค้ดที่นี่..."
                          disabled={answerSubmitted}
                          style={{
                            width: '100%',
                            color: answerSubmitted ? 'gray' : 'black',
                            height: '15rem',
                            maxWidth:'85dvw',
                            borderRadius: '10px',
                            padding: '10px',
                            fontFamily: 'monospace',
                            fontSize: '16px',
                            marginTop: '10px',
                            backgroundColor: answerSubmitted ? '#f0f0f0' : 'white',
                          }}
                        />
                      </div>
                        <button disabled={answerSubmitted} className='mt-5 mb-5 block mx-auto hover:text-green-500' onClick={checkCode}>ตรวจสอบผลลัพท์</button>
                        
                        {point != '' ?(
                          <>
                          <p className="mt-4 text-lg font-semibold">{point}</p>
                          <p className="mt-4 text-lg font-semibold">{pointCount}</p>
                          
                          </>):(<></>)}
                        
                      
                        {processing ? (
                          <p>กรุณารอคำนวณสักครู่...</p>
                        ) : (
        
                          result && answerSubmitted === false && (
                            <div>
                              <h2>ผลลัพธ์:</h2>
                              {result.success ? (
                                <p>{result.message}</p>
                              ) : (
                                <p className='text-red-500'>{result.error}</p>
                              )}

{Array.isArray(fresult) ? <>
                                <h1 className='mt-5 mb-1 text-xl'>ผลลัพธ์จากการคำนวณหรือการคอมไพล์โจทย์ (ล่าสุด):</h1>
    {fresult.map((result, index) => (
       <div key={index} style={{ marginBottom: '10px' }}>
       <p><strong>Test Case: </strong> {result.test_case}</p>
       <p>
           <strong>Expected Result: </strong> 
           <span className={result.correct ? 'text-green-500' : 'text-red-500'}>
               {result.expected}
           </span>
       </p>
       <p>
           <strong>Your Result: </strong> 
           <span className={result.correct ? 'text-green-500' : 'text-red-500'}>
               {result.your_result}
           </span>
       </p>
       <p>
           <strong>Correct: </strong> 
           <span className={result.correct ? 'text-green-500' : 'text-red-500'}>
               {result.correct ? 'Yes' : 'No'}
           </span>
       </p>
   </div>
    ))}
    
                              </>:<></>}
                            </div>
                          )
                        )}
                         {!answerSubmitted ? (
  <>
    {fresult && (
      <button 
        className='mt-5 mb-5 block mx-auto border-blue-500 hover:text-blue-500 hover:border-blue-500'
        onClick={submitAnswer}
        disabled={processing}
      >
        ส่งคำตอบ
      </button>
    )}
  </>
) : (
  <>
    <p className='my-5 text-xl'>คุณได้ส่งคำตอบแล้ว ไม่สามารถแก้ไขหรือส่งใหม่ได้</p>
  </>
)}
                        <br />
                      </> : <>
                      <p className='text-2xl'>ยังไม่ได้เปิดให้ทำโจทย์ข้อนี้ / ไม่มีโจทย์ข้อนี้</p>
                      </>}
                        
                      
                        
                       
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
  const hostAdmin = room.userHost;
  return {
    props: {
      email,
      roomNumber: id, // ส่ง roomNumber ไปด้วย
      users,
      initialQuestions: questions,
      hostAdmin
    },
  };
}

export default ExamDetailPage;
