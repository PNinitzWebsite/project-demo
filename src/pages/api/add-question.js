import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, name, exam, roles ,detel } = req.body;

  if (roles === "save") {
    try {
      const client = await clientPromise;
      const db = client.db('test');

      // Ensure exam is treated as a string
      const examString = String(exam);

      // Use the $set operator to update a specific element in the questions array
      const updateField = `questions.${exam - 1}`;
      const result = await db.collection('rooms').updateOne(
        { roomNumber: roomId },
        { $set: { [updateField]: { exam: examString, name ,detel } } },
        { upsert: true }
      );

      if (result.modifiedCount === 1 || result.upsertedCount === 1) {
        res.status(200).json({ message: `Question saved successfully N:${name} E:${exam}` });
      } else {
        res.status(400).json({ message: 'Failed to save question' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (roles === "delete") {
    try {
      const client = await clientPromise;
      const db = client.db('test');

      // Use the $pull operator to remove an element from the questions array
      const result = await db.collection('rooms').updateOne(
        { roomNumber: roomId },
        { $pull: { questions: { exam: String(exam) } } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: `Question deleted successfully E:${exam}` });
      } else {
        res.status(400).json({ message: 'Failed to delete question' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
