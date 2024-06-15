// pages/api/count-rooms.js

import { connectToDatabase } from '../../utils/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userHost } = req.query;

  try {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const roomsCollection = db.collection('rooms');

    const count = await roomsCollection.countDocuments({ userHost });

    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting rooms:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}
