// pages/api/add-name.js
import { connectToDatabase } from '../../utils/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }


  const { roomNumber, email, name,roles } = req.query;

  if(name === "" || name === "" || roles === ""){
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if(roles === "client"){
    try {
      const db = await connectToDatabase(process.env.MONGODB_URI);
      const roomsCollection = db.collection('rooms');
  
      await roomsCollection.updateOne(
        { roomNumber: roomNumber, "scores.email": email },
        {
          $set: { "scores.$.name": name },
        }
      );
  
      // Check if the email was not found and updated, if not then push the new name
      const updatedDocument = await roomsCollection.findOne({ roomNumber: roomNumber, "scores.email": email });
      if (!updatedDocument) {
        await roomsCollection.updateOne(
          { roomNumber: roomNumber },
          {
            $push: {
              scores: {
                email: email,
                name: name
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
  if(roles === "host"){
    try {
      const db = await connectToDatabase(process.env.MONGODB_URI);
      const roomsCollection = db.collection('rooms');
  
      await roomsCollection.updateOne(
        { roomNumber: roomNumber, userHost: email },
        {
          $set: { hostName: name },
        }
      );
  
      // Check if the email was not found and updated, if not then push the new name
      const updatedDocument = await roomsCollection.findOne({ roomNumber: roomNumber, userHost: email });
      if (!updatedDocument) {
        await roomsCollection.updateOne(
          { roomNumber: roomNumber },
          {
            $push: {
              hostName: name
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
}
