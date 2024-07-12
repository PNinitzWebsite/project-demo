import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, name, exam, detel, category, createdAt, code } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('test');

    const result = await db.collection('rooms').updateOne(
      { roomNumber: roomId },
      { 
        $push: { 
          questions: {
            exam: String(exam),
            name,
            detel,
            category,
            createdAt,
            isUse: false,
            code: code || ""
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