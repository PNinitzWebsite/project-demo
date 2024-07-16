import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { getCookie } from 'cookies-next';
import clientPromise from '../../../../lib/mongodb';
import Link from 'next/link';
import Layout from '@/components/layout';
import Loading from '@/components/Loading';

const CheckExam = ({ email, roomNumber, users, initialQuestions, totalScore, allAnswers: initialAllAnswers = [] }) => {
  const router = useRouter();
  const { id } = router.query;
  const [room, setRoom] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allAnswers, setAllAnswers] = useState(initialAllAnswers);
  const rules = "reset";

  const handleExit = () => {
    router.push(`/room/${id}`);
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

        if (email === room.userHost) {
          setHost('host');
        } else {
          setHost('client');
        }
      } catch (error) {
        console.error('Error fetching room:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [id, email]);

  const handleCheckAnswer = async (question, email, uniqueId, rules) => {
    try {
      await axios.post('/api/answers/check', {
        roomId: id,
        question,
        email,
        rules
      });
      if (rules === "reset") {
        alert("รีเซ็ตคำตอบแล้ว");
        window.location.reload();
      } else {
        // Update the state to mark the answer as checked
        const updatedAnswers = allAnswers.map((item) => {
          if (item.uniqueId === uniqueId) {
            return { ...item, checked: true };
          }
          return item;
        });
        setAllAnswers(updatedAnswers);
      }
    } catch (error) {
      console.error('Error checking answer:', error);
    }
  };

  // Separate answers into checked and unchecked
  const uncheckedAnswers = allAnswers.filter(item => !item.checked);
  const checkedAnswers = allAnswers.filter(item => item.checked);

  return (
    <Layout>
      {loading ? (
        <Loading />
      ) : (
        <>
          {host === 'host' ? (
            <div className="container mx-auto px-4 py-8 text-black">
              <button className="mb-8 bg-green-500 hover:bg-red-500 hover:border-red-700 text-white font-bold py-2 px-4 rounded" onClick={handleExit}>
                Exit
              </button>

              {uncheckedAnswers.length <= 0 ? (
                <>
                  <h2 className="text-3xl font-bold mb-6 text-center text-white">Unchecked Answers</h2>
                  <h2 className="text-xl font-bold mb-6 text-center text-white">ยังไม่มีคำตอบใหม่</h2>
                </>
              ) : (
                <h2 className="text-3xl font-bold mb-6 text-center text-white">Unchecked Answers</h2>
              )}

              <div className="space-y-6">
                {uncheckedAnswers.map((item) => (
                  <div key={item.uniqueId} className="bg-gray-100 shadow-lg rounded-lg p-6">
                    <h3 className="text-2xl font-semibold mb-4 text-center">Question {item.question}</h3>
                    <div className="space-y-2">
                      <p className="text-lg"><span className="font-medium">Email:</span> {item.email}</p>
                      <p className="text-lg"><span className="font-medium">Submitted At:</span> {new Date(item.submittedAt).toLocaleString()}</p>
                      <p className="text-lg"><span className="font-medium">Answer:</span> {item.answer}</p>
                      <p className="text-lg"><span className="font-medium">Code:</span> {item.code}</p>
                      <p className={`text-lg font-bold ${item.score === item.totalScore ? 'text-green-500' : 'text-red-500'}`}>
                        Score: {item.score}/{item.totalScore}
                      </p>
                    </div>
                    <button
                      className="mt-4 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => handleCheckAnswer(item.question, item.email, item.uniqueId)}
                    >
                      Mark as Checked
                    </button>
                  </div>
                ))}
              </div>

              <br />

              {checkedAnswers.length <= 0 ? (
                <>
                  <h2 className="text-3xl font-bold mb-6 text-center text-white">Checked Answers</h2>
                  <h2 className="text-xl font-bold mb-6 text-center text-white">ยังไม่ได้ตรวจสอบ</h2>
                </>
              ) : (
                <h2 className="text-3xl font-bold mb-6 text-center text-white">Checked Answers</h2>
              )}

              <div className="space-y-6">
                {checkedAnswers.map((item) => (
                  <div key={item.uniqueId} className="bg-white shadow-lg rounded-lg p-6">
                    <h3 className="text-2xl font-semibold mb-4 text-center">Question {item.question}</h3>
                    <div className="space-y-2">
                      <p className="text-lg"><span className="font-medium">Email:</span> {item.email}</p>
                      <p className="text-lg"><span className="font-medium">Submitted At:</span> {new Date(item.submittedAt).toLocaleString()}</p>
                      <p className="text-lg"><span className="font-medium">Answer:</span> {item.answer}</p>
                      <p className="text-lg"><span className="font-medium">Code:</span> {item.code}</p>
                      <p className={`text-lg font-bold ${item.score === item.totalScore ? 'text-green-500' : 'text-red-500'}`}>
                        Score: {item.score}/{item.totalScore}
                      </p>
                      <p className="text-lg text-green-500 font-medium">Status: Checked</p>
                    </div>
                    <button
                      className="mt-4 w-full bg-red-500 hover:bg-red-700 border-red-500 hover:border-red-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => handleCheckAnswer(item.question, item.email, item.uniqueId, rules)}
                    >
                      Delete Question
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {email ? (
                <>
                  <br />
                  <h1 className='text-3xl mt-5'>ไม่อนุญาตให้ตรวจสอบข้อมูลในห้องนี้!!</h1>
                  <div className='text-xl mt-5'>
                    <Link href="/">ย้อนกลับไป</Link>
                  </div>
                </>
              ) : (
                <>
                  <br />
                  <h1 className='text-3xl mt-5'>ยังไม่ได้เข้าสู่ระบบ</h1>
                  <div className='text-xl mt-5'>
                    <Link href="/">ย้อนกลับไป</Link>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </Layout>
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

  const client = await clientPromise;
  const db = client.db('test');

  const room = await db.collection('rooms').findOne({ roomNumber: id });
  if (!room) {
    return {
      notFound: true,
    };
  }

  const users = room.users || null;

  const answers = await db.collection('answers').findOne({ roomId: id });
  if (!answers) {
    return {
      notFound: true,
    };
  }

  const scoreMap = {};
  const allAnswers = [];

  Object.keys(answers).forEach(key => {
    if (key !== '_id' && key !== 'roomId') {
      Object.entries(answers[key]).forEach(([email, scoreInfo]) => {
        if (typeof scoreInfo === 'object' && scoreInfo.score !== undefined) {
          if (!scoreMap[email]) scoreMap[email] = 0;
          scoreMap[email] += scoreInfo.score;

          allAnswers.push({
            question: key,
            email: email,
            answer: scoreInfo.answer,
            score: scoreInfo.score,
            code: scoreInfo.code,
            totalScore: scoreInfo.totalScore,
            submittedAt: scoreInfo.submittedAt.toISOString(),
            checked: scoreInfo.checked || false,
            uniqueId: `${key}-${email}`
          });
        }
      });
    }
  });

  return {
    props: {
      email,
      roomNumber: id,
      users,
      initialQuestions: room.questions || '',
      totalScore: scoreMap[email] || 0,
      allAnswers: allAnswers || [],
    },
  };
}

export default CheckExam;
