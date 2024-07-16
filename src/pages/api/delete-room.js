import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomNumber } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('test');

    const result = await db.collection('rooms').deleteOne({ roomNumber: roomNumber });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: `Room ${roomNumber} deleted successfully` });
    } else {
      res.status(400).json({ message: 'Failed to delete room' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
