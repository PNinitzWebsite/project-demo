// pages/api/add-room.js

import { connectToDatabase } from '../../utils/db.js';

function generateRandomRoomNumber() {
  const min = 10000;
  const max = 99999;
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString(); // Convert number to string
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { roomNumber } = req.body;
  const userHost = req.body.userHost;
  const roomName = req.body.roomName;

  try {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const roomsCollection = db.collection('rooms');

    let newRoomNumber = roomNumber.toString();

    let existingRoom = await roomsCollection.findOne({ roomNumber: newRoomNumber,userHost: userHost,roomName:roomName });

    while (existingRoom) {
      newRoomNumber = generateRandomRoomNumber();
      existingRoom = await roomsCollection.findOne({ roomNumber: newRoomNumber,userHost: userHost,roomName:roomName });
    }

    const insertedRoom = {roomNumber: newRoomNumber,userHost: userHost,roomName:roomName};
      

    const result = await roomsCollection.insertOne(insertedRoom);

    const responseJson = {
      message: 'Room added successfully',
      roomNumber: insertedRoom.roomNumber,
      userHost: insertedRoom.userHost,
      roomName:insertedRoom.roomName,
      users:[]
    };

    return res.status(201).json(responseJson);
  } catch (error) {
    console.error('Error adding room:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}