import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomNumber, userEmail } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('test');

    const roomUpdateResult = await db.collection('rooms').updateOne(
        { roomNumber: String(roomNumber), 'scores.email': userEmail },
        { 
          $pull: { 
            scores: { email: userEmail },
            users: userEmail
          } 
        }
      );
      
    // Update answers collection to remove user's data from all numbered fields
const emailKey = userEmail.replace(/\./g, '_');

// Create an update object to unset the user's data from all possible fields
const updateObject = {};
for (let i = 1; i <= 100; i++) {  // Assuming we have up to 100 numbered fields
  updateObject[`${i}.${emailKey}`] = "";
}

const answersUpdateResult = await db.collection('answers').updateMany(
  { roomId: String(roomNumber) },
  { $unset: updateObject }
);

console.log(`Updated ${answersUpdateResult.modifiedCount} documents`);


    if (roomUpdateResult.modifiedCount > 0 || answersUpdateResult.modifiedCount > 0) {
      res.status(200).json({ message: `User ${userEmail} removed from room ${roomNumber} successfully` });
    } else {
      res.status(400).json({ message: 'Failed to remove user from room' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
