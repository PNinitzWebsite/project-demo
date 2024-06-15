import axios from 'axios';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import clientPromise from '../../../../lib/mongodb';

const Profile = ({ user, email }) => {
  const router = useRouter();
  const { id, id2 } = router.query; // `id2` is the `profileNumber`

  const handleExit = () => {
    // Redirect to another page
    router.push(`/room/${id}`);
  };

  return (
    <div>
      <div>
          <button className='text-sm mt-6 mb-6' onClick={handleExit}>Exit Room</button>
      </div>
      {email === user.email ?(
        // ถ้าเป็น user ตัวเอง
        <>
        <center className='text-2xl bg-red-500 text-center uppercase'>Admin</center>
        <br />
        </>
      ):(
        // ถ้าเป็น user อื่น
        <>
        <center className='text-2xl bg-yellow-700 text-center uppercase'>User</center>
        <br />
        </>
      )}
      <h1>User Profile</h1>
      <p><strong>Room ID:</strong> {id}</p>
      <p><strong>Profile Number:</strong> {id2}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Score:</strong> {user.score}</p>
      {/* Add more user details as needed */}
    </div>
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

  return {
    props: {
      user,
      email,
    },
  };
}

export default Profile;
