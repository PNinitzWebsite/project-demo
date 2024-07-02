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
  const [loading, setLoading] = useState(true); // เพิ่ม state เพื่อเก็บสถานะการโหลด

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const data = JSON.stringify({
        "collection": "rooms",
        "database": "test",
        "dataSource": "Cluster0",
        "filter": {
          roomNumber: String(id)  // Ensure id is a string
        }
      });
    
      const config = {
        method: 'post',
        url: 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-lkmge/endpoint/data/v1/action/find',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.API_KEY,
          'Accept': 'application/json'
        },
        data: data
      };
    
      try {
        const response = await axios(config);
        // console.log(JSON.stringify(response.data.documents));
        setData(response.data.documents ? response.data.documents : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // ตั้งค่า loading เป็น false เมื่อการประมวลผลเสร็จสิ้น
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
        <Leaderboard data={data} />
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
