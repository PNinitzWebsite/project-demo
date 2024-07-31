import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, name, exam ,detel,category } = req.body;

    try {
      const client = await clientPromise;
      const db = client.db('test');

      // Ensure exam is treated as a string
      const examString = String(exam);

      // Use the $set operator to update a specific element in the questions array
      const updateField = `questions.${exam - 1}`;
      const currentDate = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
      const result = await db.collection('rooms').updateOne(
        { roomNumber: roomId },
        { 
          $set: { 
            [updateField]: {
              exam:examString,
              name,
              detel,
              category,
              createdAt:currentDate,
              isUse:false
            }
          }
        },
        { upsert: true }
      );

      if (result.modifiedCount === 1 || result.upsertedCount === 1) {
        res.status(200).json({ message: `Question saved successfully N:${name} E:${exam} C:${category}` });
      } else {
        res.status(400).json({ message: 'Failed to save question' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  
}
