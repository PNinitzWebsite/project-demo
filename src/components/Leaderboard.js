import React, { useMemo } from 'react';
import Link from 'next/link';
import styles from './Leaderboard.module.css';
import { useRouter } from 'next/router';

const Leaderboard = ({ data, scores }) => {
  const router = useRouter();
  const { id } = router.query;

  // console.log("data:", data);
  // console.log("scores:", scores);

  const sortedData = useMemo(() => {
    // สร้าง map ของ scores จาก email
    const scoreMap = Object.values(scores).reduce((acc, item) => {
      if (typeof item === 'object' && !Array.isArray(item)) {
        Object.entries(item).forEach(([email, scoreInfo]) => {
          if (typeof scoreInfo === 'object' && scoreInfo.score !== undefined) {
            if (!acc[email]) acc[email] = 0;
            acc[email] += scoreInfo.score;
          }
        });
      }
      return acc;
    }, {});

    // console.log("scoreMap:", scoreMap);

    // อัปเดตคะแนนใน data.scores โดยใช้ scoreMap
    const updatedScores = data.scores.map(s => {
      const transformedEmail = s.email.replace(/\./g, '_');
      return {
        ...s,
        score: scoreMap[transformedEmail] || s.score
      };
    });

    // console.log("updatedScores:", updatedScores);

    // สร้างข้อมูลที่รวมคะแนนทั้งหมด
    const aggregatedData = updatedScores.reduce((acc, score) => {
      const existingIndex = acc.findIndex(item => item.email === score.email);
      if (existingIndex === -1) {
        acc.push({
          email: score.email,
          name: score.name,
          totalScore: score.score,
          profileNumber: score.profileNumber,
          rooms: new Set([data.roomNumber])
        });
      } else {
        acc[existingIndex].totalScore += score.score;
        acc[existingIndex].rooms.add(data.roomNumber);
      }
      return acc;
    }, []);

    // console.log("aggregatedData:", aggregatedData);

    return aggregatedData
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        rooms: Array.from(item.rooms)
      }));
  }, [data, scores]);

  if (!sortedData.length) {
    return <div>No scores available</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className='text-2xl p-5'>Leaderboard</h1>
      <div className={styles.topThree}>
        {sortedData.slice(0, 3).map((item, index) => (
          <div key={item.email} className={styles.topBox}>
            <h2>#{item.rank}</h2>
            <Link className={styles.topLink} href={`/room/${id}/profile/${item.profileNumber}`}>
              <p>{item.name}</p>
            </Link>
            <p>{item.totalScore} points</p>
          </div>
        ))}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Total Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.slice(3).map((item, index) => (
            <tr key={item.email}>
              <td>{item.rank}</td>
              <td>
                <Link href={`/room/${id}/profile/${item.profileNumber}`} className={styles.link}>
                  <p>{item.name}</p>
                </Link>
              </td>
              <td>{item.totalScore} points</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
