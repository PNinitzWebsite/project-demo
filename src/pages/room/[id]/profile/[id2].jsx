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
    <Layout pageTitle={`User Profile : ${user.name}`}>
      {users && users.includes(email) || host == email ? (
        <>
          <nav className='my-5'>
             <button className='text-sm btn-gray' onClick={handleExit}>Go to room</button>      
         </nav>
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
          <main className='space-y-3'>
            <h1 className='text-xl'>User Profile</h1>
            <p className='text-lg'><strong>Room ID:</strong> {roomNumber}</p>
            <p className='text-lg'><strong>Profile Number:</strong> {id2}</p>
            <p className='text-lg'><strong>Email:</strong> {user.email}</p>
            <p className='text-lg'><strong>Name:</strong> {user.name}</p>
            <p className='text-lg'><strong>Score:</strong> {totalScore}</p>
            {/* Add more user details as needed */}
          </main>
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
  const { id, id2 } = context.params;
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

  let totalScore = 0;
  const answers = await db.collection("answers").findOne({ roomId: id });
  if (answers) {
    const scoreMap = Object.keys(answers).reduce((acc, key) => {
      if (key !== '_id' && key !== 'roomId') {
        Object.entries(answers[key]).forEach(([email, scoreInfo]) => {
          if (typeof scoreInfo === 'object' && scoreInfo.score !== undefined) {
            if (!acc[email]) acc[email] = 0;
            acc[email] += scoreInfo.score;
          }
        });
      }
      return acc;
    }, {});

    const transformedEmail = user.email.replace(/\./g, '_');
    totalScore = scoreMap[transformedEmail] || 0;
  }

  return {
    props: {
      user,
      email,
      roomNumber: id,
      users: room.users,
      host: room.userHost,
      totalScore,
    },
  };
}


export default Profile;
