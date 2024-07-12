import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { roomId, examKey, newCategory } = req.body;
      const client = await clientPromise;
      const db = client.db("test");

      const result = await db.collection("rooms").updateOne(
        { roomNumber: roomId, [`questions.${examKey}`]: { $exists: true } },
        { $set: { [`questions.${examKey}.category`]: newCategory } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'Category updated successfully' });
      } else {
        res.status(404).json({ message: 'Question not found or category not updated' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating category', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}