
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('test');

    const { roomId, question, exam ,name,detel } = req.body;
    const updateField = `questions.${parseInt(exam)-1}`;
    const examString = parseInt(exam);

    const result = await db.collection('rooms').updateOne(
      { roomNumber: roomId },
      { $set: { [updateField]: { exam: String(examString) ,question, name ,detel } } },
      { upsert: true }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Question inserted successfully' });
    } else if (result.matchedCount === 0) {
      res.status(404).json({ message: 'Room not found' });
    } else {
      res.status(400).json({ message: 'Failed to insert question' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}