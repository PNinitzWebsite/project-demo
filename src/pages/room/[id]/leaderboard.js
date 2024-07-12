import { useEffect, useState } from 'react';
import axios from 'axios';
import Leaderboard from '../../../components/Leaderboard';
import Layout from '@/components/layout';
import { getCookie } from 'cookies-next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Loading from '../../../components/Loading'; // นำเข้า component Loading
import clientPromise from '../../../lib/mongodb';

const LeaderboardPage = ( { email , users , host }) => {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true); // เพิ่ม state เพื่อเก็บสถานะการโหลด

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
  
      try {
        const res = await fetch(`/api/room/${id}`);
        if (!res.ok) {
          throw new Error('Room not found');
        }
  
        const data1 = await res.json();
        const { room,answer } = data1;

        const roomData = room;
        const scoresData = answer;
  
        setData(roomData || []);
        setScores(scoresData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [id]);

  return (
    <div>
      <Layout>
      {users && users.includes(email) || host == email ? (
      <>
       <Link className='text-xl mt-10 block' href="/room/[id]" as={`/room/${id}`}>
        Go to room
      </Link>
      <h1 className='text-xl'>Leaderboard for Room: {id}</h1>
      {loading ? (
        <Loading /> // แสดงภาพการโหลดเมื่อกำลังดึงข้อมูล
      ) : (
        <Leaderboard data={data} scores={scores} />
      )}
      </>
     ):(
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
      </Layout>
    </div>
  );
};

export async function getServerSideProps(context) {
  const { id } = context.params;
  const req = context.req;
  const res = context.res;
  var email = getCookie('email', { req, res });
  if (email == undefined) {
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

  return { props: { email ,users: room.users, host: room.userHost } };
};


export default LeaderboardPage;
