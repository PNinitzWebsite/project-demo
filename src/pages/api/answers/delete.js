// pages/api/answers/delete.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { roomId, question } = req.body;

  if (!roomId || !question) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('test');
    const answersCollection = db.collection('answers');

    // Find the document for the room
    const answersDoc = await answersCollection.findOne({ roomId: roomId });

    if (!answersDoc) {
      return res.status(404).json({ message: 'Answers not found' });
    }

    // Check if the question exists
    if (answersDoc[question]) {
      // Use $unset to remove the question field
      const unsetField = {};
      unsetField[question] = "";

      await answersCollection.updateOne(
        { roomId: roomId },
        { $unset: unsetField }
      );

      return res.status(200).json({ message: 'Question answers deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    console.error('Error deleting answers:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
