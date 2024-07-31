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

    // Reset answers for the specified question
    if (answersDoc[question]) {
      Object.keys(answersDoc[question]).forEach(email => {
        if (typeof answersDoc[question][email] === 'object') {
          answersDoc[question][email].checked = false;
        }
      });

      // Update the document in the database
      await answersCollection.updateOne(
        { roomId: roomId },
        { $set: { [question]: answersDoc[question] } }
      );

      return res.status(200).json({ message: 'Answers reset successfully' });
    } else {
      return res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    console.error('Error resetting answers:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
