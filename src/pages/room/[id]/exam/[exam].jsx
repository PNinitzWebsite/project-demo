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
  const [result, setResult] = useState(null);
  const [fresult, setFresult] = useState(null);
  const [close, setClose] = useState(false); 
  const [processing, setProcessing] = useState(false); // เพิ่ม state เพื่อเก็บสถานะของการประมวลผล
  const [loading, setLoading] = useState(true); // เพิ่ม state เพื่อเก็บสถานะการโหลด
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [variableCheckResult, setVariableCheckResult] = useState([]);
  const [point, setPoint] = useState('');
  const [pointCount, setPointCount] = useState('');
  
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [variableScores, setVariableScores] = useState({});
  
  // ฟังก์ชันสำหรับอัปเดตคะแนนของตัวแปร
  const updateVariableScore = (varName, score) => {
    setVariableScores(prevScores => ({
      ...prevScores,
      [varName]: score
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
          setPointCount(`คะแนนของคุณ: ${data.totalScore}/${data.maxScore} คะแนน`);
        }
      } catch (error) {
        console.error('Error checking submitted answer:', error);
      }
    }; 
  
    if(id && exam && email && host !== "host"){
      checkSubmittedAnswer();
    }
  }, [email, id, exam, host]);

  useEffect(() => {
    if (questions[parseInt(exam)-1]?.variableScores) {
      setVariableScores(questions[parseInt(exam)-1].variableScores);
    } else if (questions[parseInt(exam)-1]?.question) {
      // If there's a question but no variableScores, create new ones
      const newVariableScores = questions[parseInt(exam)-1].question.split(',').reduce((acc, variable) => {
        const varName = variable.split('=')[0];
        acc[varName] = 0;
        return acc;
      }, {});
      setVariableScores(newVariableScores);
    }
  }, [exam, questions]);


  const submitAnswer = async () => {
    if (!fresult) {
      alert('กรุณาตรวจสอบโค้ดของคุณก่อนส่งคำตอบ');
      return;
    }
    
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
        window.location.reload();
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

const checkSyntax = async () => {
  if (!code.trim()) {
    setResult({success:false,error:'กรุณากรอกโค้ด'});
    return;
  }
  setProcessing(true);
  const response = await fetch('/api/checkSyntax', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();
  
  setResult(data);
  setProcessing(false);
  if (data.compiledResult) {
    console.log("DATA:",data.compiledResult)
    const lines = code.split('\n');
    const variables = {};

    lines.forEach(line => {
      if (line.includes('=') && !line.trim().startsWith('print')) {
        const [varName, varValue] = line.split('=').map(part => part.trim());
        variables[varName] = varValue;
      }
    });

    // ประเมินค่าของตัวแปรที่มีการคำนวณ
    Object.keys(variables).forEach(varName => {
      if (variables[varName].includes('-') || variables[varName].includes('+')) {
        variables[varName] = eval(variables[varName].replace(/[a-zA-Z]/g, match => variables[match] || match));
      }
    });

    const fResult = Object.entries(variables).map(([name, value]) => `${name}=${value}`).join(',');
    setFresult(fResult);

    // ตรวจสอบความถูกต้องของแต่ละตัวแปร
    const correctAnswer = questions[parseInt(exam)-1]?.question; // เพิ่ม ? เพื่อป้องกัน null
    if (correctAnswer) {
      const correctVariables = correctAnswer.split(',').reduce((acc, curr) => {
        const [name, value] = curr.split('=');
        acc[name] = value;
        return acc;
      }, {});

      const checkResult = Object.keys(correctVariables).map(varName => {
        const isCorrect = variables[varName] === correctVariables[varName];
        const isDefined = varName in variables;
        return { varName, isCorrect, isDefined };
      });

      setVariableCheckResult(checkResult);
    } else {
      setVariableCheckResult([]);
    }
  } else {
    setResult(data.message || 'เกิดข้อผิดพลาด');
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
   if(!questions[parseInt(exam)-1].code){
    alert('ไม่มีโค้ด');
   }else{
    setCode(questions[parseInt(exam)-1].code);
   }

  } catch (error) {
    console.error('Error:', error);
    alert('เกิดข้อผิดพลาดในดึงโค้ด');
  } finally {
    setProcessing(false);
  }
};

// ฟังก์ชันสำหรับบันทึกโจทย์
const saveQuestion = async (compiledResult, variableScores) => {
  try {
    const variables = compiledResult.split(',').map(v => v.split('=')[0]);
    const newVariableScores = variables.reduce((acc, varName) => {
      acc[varName] = variableScores[varName] || 0;
      return acc;
    }, {});

    const response = await fetch('/api/saveQuestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        roomId: id,
        question: compiledResult,
        exam: questions[parseInt(exam)-1].exam,
        variableScores: newVariableScores
      }),
    });
    
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      setQuestions(prevQuestions => {
        if (!Array.isArray(prevQuestions)) {
          return []; // หรือให้กำหนดเป็นอาเรย์ว่างหากไม่ใช่ array
        }
      
        return [
          ...prevQuestions.slice(0, parseInt(exam) - 1),
          { ...prevQuestions[parseInt(exam) - 1], question: compiledResult, variableScores: newVariableScores },
          ...prevQuestions.slice(parseInt(exam))
        ];
      });      
      setVariableScores(newVariableScores);
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
                        <h1 className='mt-5'>ข้อสอบ {exam}</h1>

                        <h1 className='mt-10 mb-5 text-2xl'>กรอกโจทย์โค้ด Python หัวข้อ: {initialQuestions[parseInt(exam)-1].name}</h1>
                        <div>
                        <button className='text-sm mt-2 mb-6' onClick={handleCode}>ดึงโจทย์เก่า</button>
                        </div>
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
              height: '15rem',maxWidth:'70dvw',
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
                             
                              {fresult && (
                                <>
                                  <p className='mt-2 text-green-500'>ผลลัพธ์จากการคำนวณหรือการคอมไพล์โจทย์ (ล่าสุด): <br /> {fresult}</p>
            
                                   {fresult === initialQuestions[parseInt(exam)-1].question ? (
                                  <>
                                    <h1 className='mt-5 mb-1 text-xl'>ตั้งค่าคะแนนสำหรับแต่ละตัวแปร:</h1>
                                    {fresult.split(',').map(variable => {
                                      const varName = variable.split('=')[0];
                                      return (
                                        <div key={varName} className="mb-2">
                                          <label htmlFor={`score-${varName}`} className="mr-2">{varName}:</label>
                                          <input
                                            type="number"
                                            id={`score-${varName}`}
                                            value={(variableScores && variableScores[varName] !== undefined) ? variableScores[varName] : 0}
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
                                    <button disabled={close}
                                      className='mt-3' 
                                      onClick={() => saveQuestion(fresult, variableScores)}
                                    >
                                      ตั้งค่าผลลัพธ์และคะแนนเป็นโจทย์
                                    </button>
                                    
                                    <h1 className='mt-10 text-xl'>เช็กโค้ดเดิม (จากการคำนวณล่าสุด)</h1>
                                    <h1 className='mb-10 text-green-300 text-xl'>
                                    <br />
                                    <FontAwesomeIcon icon="fa-solid fa-circle-check" className='w-8 mr-2 inline-table'/>
                                      คำตอบถูกต้องทั้งหมด</h1>
                                  </>
                                ) : (
                                  <>
                                  <h1 className='mt-5 mb-1 text-xl'>ตั้งค่าคะแนนสำหรับแต่ละตัวแปร:</h1>
                                  {fresult.split(',').map(variable => {
                                    const varName = variable.split('=')[0];
                                    return (
                                      <div key={varName} className="mb-2">
                                        <label htmlFor={`score-${varName}`} className="mr-2">{varName}:</label>
                                        <input
                                          type="number"
                                          id={`score-${varName}`}
                                          value={variableScores[varName] !== undefined ? variableScores[varName] : 0}
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
                                  <button disabled={close}
                                    className='my-4' 
                                    onClick={() => saveQuestion(fresult, variableScores)}
                                  >
                                    ตั้งค่าโจทย์ผลลัพธ์ใหม่
                                  </button>


                                    {initialQuestions[parseInt(exam)-1].question === "" ? (
                                      <h1 className=' text-red-300 text-xl'>ไม่มีเฉลย</h1>
                                    ) : (
                                      <>
                                        {initialQuestions[parseInt(exam)-1].question ? 
                                        <h1 className='mt-10 mb-3 text-xl'>ผลการทดสอบแต่ละตัวแปร (ตามโจทย์เดิม)</h1>
                                      : ""}
                                        {variableCheckResult.map(({ varName, isCorrect, isDefined }) => (
                                        <p key={varName} className={isDefined ? (isCorrect ? 'text-green-500' : 'text-red-500') : 'text-yellow-500'}>
                                          {varName}: {
                                            isDefined 
                                              ? (isCorrect ? 'ถูกต้อง' : 'ไม่ถูกต้อง') 
                                              : 'ไม่ได้กำหนดค่า'
                                          }
                                        </p>
                                      ))}
                                      
                                       
                                      </>
                                    )}
                                  </>
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
                        <button disabled={answerSubmitted} className='mt-5 mb-5 block mx-auto hover:text-green-500' onClick={checkSyntax}>ตรวจสอบผลลัพท์</button>
                        
                        {point != '' ?(
                          <>
                          <p className="mt-4 text-lg font-semibold">{point}</p>
                          <p className="mt-4 text-lg font-semibold">{pointCount}</p>
                          
                          </>):(<></>)}
                        
                      
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
                              {fresult && (
                              <>
                                <p className='mt-2 text-green-500'>ผลลัพธ์จากการคำนวณหรือการคอมไพล์: {fresult}</p>

                                {fresult === questions[parseInt(exam)-1].question ? (
                                  <>
                                    <h1 className='mb-6 text-green-300 text-xl'>
                                    <br />
                                    <FontAwesomeIcon icon="fa-solid fa-circle-check" className='w-8 mr-2 inline-table'/>
                                      คำตอบถูกต้องทั้งหมด</h1>
                                  </>
                                ) : (
                                  <>
                                    {questions[parseInt(exam)-1].question === "" ? (
                                      <h1 className=' text-red-300 text-xl'>ไม่มีคำโจทย์</h1>
                                    ) : (
                                      <>
                                        <h1 className='mb-2 text-xl'>ผลการตรวจสอบแต่ละตัวแปร:</h1>
                                        {variableCheckResult.map(({ varName, isCorrect, isDefined }) => (
                                        <p key={varName} className={isDefined ? (isCorrect ? 'text-green-500' : 'text-red-500') : 'text-yellow-500'}>
                                          {varName}: {
                                            isDefined 
                                              ? (isCorrect ? 'ถูกต้อง' : 'ไม่ถูกต้อง') 
                                              : 'ไม่ได้กำหนดค่า'
                                          }
                                        </p>
                                      ))}
                                      </>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                           
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
