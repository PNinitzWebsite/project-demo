// pages/api/saveQuestion.js
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { code, roomId, testCases,expectedResults, exam, variableScores } = req.body;
      const client = await clientPromise;
      const db = client.db("test");

      const result = await db.collection("rooms").updateOne(
        { roomNumber: roomId, "questions.exam": String(exam) },
        { 
          $set: { 
            "questions.$.testCase": testCases,
            "questions.$.expectedResults": expectedResults,
            "questions.$.code": code,
            "questions.$.variableScores": variableScores
          } 
        }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'Question updated successfully' });
      } else {
        res.status(305).json({ message: 'โจทย์เดิม (ไม่ได้เปลี่ยนแปลง)' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating question' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}