// pages/api/submitAnswer.js
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { roomId, examId, email, answer, code } = req.body;

      console.log(roomId, examId, email, answer, code);

      const client = await clientPromise;
      const db = client.db("test");

      const room = await db.collection("rooms").findOne({ roomNumber: roomId });
      if (!room) {
        return res.status(404).json({ message: 'ไม่พบห้อง' });
      }

      // ปรับการเข้าถึงคำถามให้เป็นแบบ object
      const question = room.questions[examId-1];
      if (!question) {
        return res.status(404).json({ message: 'ไม่พบคำถาม' });
      }

      const correctAnswer = question.question;
      if (!correctAnswer) {
        return res.status(400).json({ message: 'ยังไม่มีคำตอบที่ถูกต้อง' });
      }

      const userAnswerVars = answer ? answer.split(',') : [];
      const correctAnswerVars = correctAnswer.split(',');
      let score = 0;

      userAnswerVars.forEach(userVar => {
        const [varName, varValue] = userVar.split('=');
        const correctVar = correctAnswerVars.find(cv => cv.startsWith(`${varName}=`));
        if (correctVar) {
          const [, correctValue] = correctVar.split('=');
          if (varValue === correctValue) {
            score += question.variableScores?.[varName] || 0;
          }
        }
      });

      const totalScore = Object.values(question.variableScores || {}).reduce((a, b) => a + b, 0);

      const emailKey = email.replace(/\./g, '_');

      const result = await db.collection("answers").updateOne(
        { roomId: roomId },
        {
          $set: {
            [`${examId}.${emailKey}.answer`]: answer,
            [`${examId}.${emailKey}.code`]: code,
            [`${examId}.${emailKey}.score`]: score,
            [`${examId}.${emailKey}.totalScore`]: totalScore,
            [`${examId}.${emailKey}.submittedAt`]: new Date(),
            [`${examId}.${emailKey}.checked`]: false
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        res.status(200).json({ message: 'บันทึกคำตอบสำเร็จ', score, totalScore });
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