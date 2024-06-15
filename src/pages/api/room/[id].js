// pages/api/room/[id].js

import { connectToDatabase } from '../../../utils/db.js';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  if (method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const roomsCollection = db.collection('rooms');

    const room = await roomsCollection.findOne({ roomNumber: id });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // If room found, return the room details
    return res.status(200).json({ room });
  } catch (error) {
    console.error('Error retrieving room:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}
