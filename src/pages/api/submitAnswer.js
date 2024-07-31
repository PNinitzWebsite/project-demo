// pages/api/submitAnswer.js
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { roomId, examId, email, answer, code } = req.body;

      console.log("Received answer:", JSON.stringify(answer, null, 2));

      const client = await clientPromise;
      const db = client.db("test");

      const room = await db.collection("rooms").findOne({ roomNumber: roomId });
      if (!room) {
        return res.status(404).json({ message: 'ไม่พบห้อง' });
      }

      const question = room.questions.find(q => q.exam === examId);
      if (!question) {
        return res.status(404).json({ message: 'ไม่พบคำถาม' });
      }

      const { variableScores } = question;
      if (!variableScores) {
        return res.status(400).json({ message: 'ยังไม่มีคำตอบที่ถูกต้อง' });
      }

      console.log("Variable Scores:", JSON.stringify(variableScores, null, 2));

      let score = 0;
      let correctCount = 0;
      const totalQuestions = answer.length;

      answer.forEach((item, index) => {
        if (item.correct) {
          correctCount++;
          const testCaseIndex = index + 1; // เริ่มจาก 1
          const caseScore = variableScores[`TestCase${testCaseIndex}`];
          if (caseScore !== undefined) {
            score += caseScore;
            console.log(`TestCase${testCaseIndex} score:`, caseScore);
          } else {
            console.log(`Score not found for TestCase${testCaseIndex}`);
          }
        }
      });

      console.log("Total calculated score:", score);
      console.log("Correct answers:", correctCount);
      console.log("Total questions:", totalQuestions);

      const totalScore = Object.values(variableScores).reduce((a, b) => a + b, 0);

      const emailKey = email.replace(/\./g, '_');
      const currentDate = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

      const result = await db.collection("answers").updateOne(
        { roomId: roomId },
        {
          $set: {
            [`${examId}.${emailKey}.answer`]: answer,
            [`${examId}.${emailKey}.code`]: code,
            [`${examId}.${emailKey}.score`]: score,
            [`${examId}.${emailKey}.totalScore`]: totalScore,
            [`${examId}.${emailKey}.correctCount`]: correctCount,
            [`${examId}.${emailKey}.totalQuestions`]: totalQuestions,
            [`${examId}.${emailKey}.submittedAt`]: currentDate,
            [`${examId}.${emailKey}.checked`]: false,
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        res.status(200).json({ 
          message: 'บันทึกคำตอบสำเร็จ', 
          score, 
          totalScore, 
          correctCount, 
          totalQuestions 
        });
      } else {
        res.status(400).json({ message: 'ไม่สามารถบันทึกคำตอบได้' });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกคำตอบ' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
