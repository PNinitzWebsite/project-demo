// pages/api/add-score.js
import { connectToDatabase } from '../../utils/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { roomNumber, email, score } = req.query;

  try {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const roomsCollection = db.collection('rooms');

    await roomsCollection.updateOne(
      { roomNumber: roomNumber, "scores.email": email },
      {
        $set: { "scores.$.score": parseInt(score) },
      }
    );

    // Check if the email was not found and updated, if not then push the new score
    const updatedDocument = await roomsCollection.findOne({ roomNumber: roomNumber, "scores.email": email });
    if (!updatedDocument) {
      await roomsCollection.updateOne(
        { roomNumber: roomNumber },
        {
          $push: {
            scores: {
              email: email,
              score: parseInt(score)
            }
          }
        }
      );
    }

    const userHostRooms = await roomsCollection.find({ roomNumber: roomNumber }).toArray();

    return res.status(200).json({ rooms: userHostRooms, count: userHostRooms.length });
  } catch (error) {
    console.error('Error fetching user host rooms:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}
