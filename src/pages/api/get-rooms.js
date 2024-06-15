// pages/api/get-rooms.js

import { connectToDatabase } from '../../utils/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userHost } = req.query;
  const users = req.query.users;

  try {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const roomsCollection = db.collection('rooms');

    const userHostRooms = await roomsCollection.find({ userHost: userHost }).toArray();
    const usersRooms = await roomsCollection.find({ users: users }).toArray();

    return res.status(200).json({ rooms: userHostRooms, count: userHostRooms.length ,clientRooms:usersRooms ,clientRoomsCount:usersRooms.length});
  } catch (error) {
    console.error('Error fetching user host rooms:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}
