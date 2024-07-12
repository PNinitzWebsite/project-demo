// pages/api/room/[id].js

import { connectToDatabase } from '../../../utils/db.js';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  // console.log("Received id:", id);

  if (method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const roomsCollection = db.collection('rooms');
    const answersCollection = db.collection('answers');

    const room = await roomsCollection.findOne({ roomNumber: id });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    let answer = null;
    try {
      answer = await answersCollection.findOne({ roomId: id });
    } catch (error) {
      console.error('Error fetching answer:', error);
    }
    
    // Return room data even if answer is not found
    return res.status(200).json({ room, answer });
  } catch (error) {
    console.error('Error retrieving room:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}
