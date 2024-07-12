import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { roomNumber, questionKey } = req.body;
      const client = await clientPromise;
      const db = client.db('test');
    
      const result = await db.collection('rooms').updateOne(
        { roomNumber: roomNumber },
        { $unset: { [`questions.${questionKey}`]: "" } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'Question deleted successfully' });
      } else {
        res.status(404).json({ message: 'Question not found or already deleted' });
      }
    } catch (error) {
      console.error('Error details:', error);
      res.status(500).json({ message: 'Error deleting question', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}