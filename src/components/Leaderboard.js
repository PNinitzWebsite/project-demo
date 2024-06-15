import React from 'react';
import Link from 'next/link';
import styles from './Leaderboard.module.css';
import { useRouter } from 'next/router';

const Leaderboard = ({ data }) => {
  const router = useRouter();
  const { id } = router.query;

  // Flatten the scores
  const flattenedData = data.reduce((acc, item) => {
    const scoresWithRoomInfo = item.scores.map(score => ({
      email: score.email,
      score: score.score,
      name: score.name,
      roomNumber: item.roomNumber,
      profileNumber: score.profileNumber // Assume profileNumber is stored in MongoDB
    }));
    return acc.concat(scoresWithRoomInfo);
  }, []);

  // Sort the flattened scores
  const sortedData = flattenedData.sort((a, b) => b.score - a.score);

  if (!sortedData.length) {
    return <div>No scores available</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className='text-2xl p-5'>Leaderboard</h1>
      <div className={styles.topThree}>
        {sortedData.slice(0, 3).map((item, index) => (
          <div key={index} className={styles.topBox}>
            <h2>#{index + 1}</h2>
            <Link className={styles.topLink} href={`/room/${id}/profile/${item.profileNumber}`}>
              <p>{item.name}</p>
            </Link>
            <p>{item.score} points</p>
          </div>
        ))}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.slice(3).map((item, index) => (
            <tr key={index + 3}>
              <td>{index + 4}</td>
              <td>
                <Link href={`/room/${id}/profile/${item.profileNumber}`} className={styles.link}>
                  <p>{item.name}</p>
                </Link>
              </td>
              <td>{item.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
