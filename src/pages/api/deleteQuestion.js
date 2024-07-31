import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { roomNumber, questionKey } = req.body;
      const client = await clientPromise;
      const db = client.db('test');

      // Find the document that matches the roomNumber
      const room = await db.collection('rooms').findOne({ roomNumber: roomNumber });
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      // Remove the desired item from the questions array
      if (room.questions && room.questions.length > questionKey) {
        room.questions.splice(questionKey, 1); // Remove the item from the array
      } else {
        return res.status(404).json({ message: 'Question key not found' });
      }

      // Create an update object to unset the specific answer
      const updateObject = {};
      updateObject[`${questionKey}`] = {questionKey}; // Use 1 to specify the field to be removed

      const answersUpdateResult = await db.collection('answers').updateMany(
        { roomId: String(roomNumber) },
        { $unset: updateObject }
      );

      // Update the document with the new questions array
      const updateResult = await db.collection('rooms').updateOne(
        { roomNumber: roomNumber },
        { $set: { questions: room.questions } }
      );

      if (updateResult.modifiedCount === 1 || answersUpdateResult.modifiedCount > 0) {
        res.status(200).json({ message: 'Question deleted successfully' });
      } else {
        res.status(500).json({ message: 'Error updating questions array' });
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
