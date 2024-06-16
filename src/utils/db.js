// utils/db.js

import { MongoClient } from 'mongodb';

// Function to connect to MongoDB
export async function connectToDatabase(uri) {
  const client = new MongoClient(uri, { });
  await client.connect();
  return client.db();
}

// Function to get room by ID from MongoDB
export async function getRoomById(roomId) {
  try {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const roomsCollection = db.collection('rooms');
    const room = await roomsCollection.findOne({ roomNumber: roomId });
    return room;
  } catch (error) {
    throw new Error('Error fetching room data');
  }
}
