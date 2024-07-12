import axios from 'axios';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import clientPromise from '../../../../lib/mongodb';
import Link from 'next/link';
import Layout from '@/components/layout'; // นำเข้า Layout

const Profile = ({ user, email, roomNumber, users, host, totalScore }) => {
  const router = useRouter();
  const { id, id2 } = router.query; // `id2` is the `profileNumber`

  const handleExit = () => {
    // Redirect to another page
    router.push(`/room/${id}`);
  };

  return (
    <Layout>
      {users && users.includes(email) || host == email ? (
        <>
          <div>
            <button className='text-sm mt-6 mb-6' onClick={handleExit}>Exit Room</button>
          </div>
          {email === user.email ? (
            // ถ้าเป็น user ตัวเอง
            <>
              <center className='text-2xl bg-red-500 text-center uppercase'>Admin</center>
              <br />
            </>
          ) : (
            // ถ้าเป็น user อื่น
            <>
              <center className='text-2xl bg-yellow-700 text-center uppercase'>User</center>
              <br />
            </>
          )}
          <h1>User Profile</h1>
          <p><strong>Room ID:</strong> {roomNumber}</p>
          <p><strong>Profile Number:</strong> {id2}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Score:</strong> {totalScore}</p>
          {/* Add more user details as needed */}
        </>
      ) : (
        <>
          {email ? (
            <>
              <br />
              <h1 className='text-3xl mt-5'>ไม่อนุญาตให้ตรวจสอบข้อมูลในห้องอื่น ถ้ายังไม่ได้เข้าร่วมห้อง</h1>
              <div className='text-xl mt-5'>
                <Link href="/" >ย้อนกลับไป</Link>
              </div>
            </>
          ) : (
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
  );
};

export async function getServerSideProps(context) {
  const { id, id2 } = context.params; // `id2` is the `profileNumber`
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

  const user = room.scores.find(score => score.profileNumber === parseInt(id2, 10));
  if (!user) {
    return {
      notFound: true,
    };
  }

  const answers = await db.collection("answers").findOne({ roomId: id });
  if (!answers) {
    return {
      notFound: true,
    };
  }

  // คำนวณ totalScore จากข้อมูลใน answers และ email
  const scoreMap = Object.keys(answers).reduce((acc, key) => {
    if (key !== '_id' && key !== 'roomId') { // กรองคีย์ที่ไม่ใช่คะแนน
      Object.entries(answers[key]).forEach(([email, scoreInfo]) => {
        // console.log("Processing email:", email, "scoreInfo:", scoreInfo);
        if (typeof scoreInfo === 'object' && scoreInfo.score !== undefined) {
          if (!acc[email]) acc[email] = 0;
          acc[email] += scoreInfo.score;
        }
      });
    }
    return acc;
  }, {});

  const transformedEmail = user.email.replace(/\./g, '_'); // แปลง . เป็น _
  const totalScore = scoreMap[transformedEmail] || 0;

  return {
    props: {
      user,
      email,
      roomNumber: id, // ส่ง roomNumber ไปด้วย
      users: room.users, // ส่ง users ไปด้วย
      host: room.userHost,
      totalScore, // ส่ง totalScore ไปด้วย
    },
  };
}

export default Profile;