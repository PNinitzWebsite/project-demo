import { useEffect, useState } from 'react';
import axios from 'axios';
import Leaderboard from '../../../components/Leaderboard';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LeaderboardPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState([]);

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
        console.log(JSON.stringify(response.data.documents));
        setData(response.data.documents ? response.data.documents : []);
        // Handle response data here
      } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error here
      }
    };
    
    fetchData();
  }, [id]);

  return (
    <div>
      <Link className='text-xl mt-10 block' href="/room/[id]" as={`/room/${id}`}>
        Go to room
      </Link>
      <h1 className='text-xl'>Leaderboard for Room: {id}</h1>
      <Leaderboard data={data} />
    </div>
  );
};

export default LeaderboardPage;
