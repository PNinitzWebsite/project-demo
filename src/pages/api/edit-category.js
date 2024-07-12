import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, oldCategory, newCategory, isUse } = req.body;

  console.log(isUse)

  if(isUse == undefined){
    try {
      const client = await clientPromise;
      const db = client.db('test');
  
      const room = await db.collection('rooms').findOne({ roomNumber: roomId });
  
      if (room) {
        const questions = room.questions;
        const updatedFields = {};
  
        for (const key in questions) {
          if (questions[key].category === oldCategory) {
            updatedFields[`questions.${key}.category`] = newCategory;    
          }
        }
  
        const result = await db.collection('rooms').updateOne(
          { roomNumber: roomId },
          { $set: updatedFields }
        );
  
        if (result.modifiedCount > 0) {
          res.status(200).json({ message: 'เปลี่ยนชื่อหมวดหมู่สำเร็จ' });
        } else {
          res.status(400).json({ message: 'ไม่ได้เปลี่ยนชื่อหมวดหมู่ (ชื่อเดิม)' });
        }
      } else {
        res.status(404).json({ message: 'Room not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }else{
    try {
      const client = await clientPromise;
      const db = client.db('test');
  
      const room = await db.collection('rooms').findOne({ roomNumber: roomId });
  
      if (room) {
        const questions = room.questions;
        const updatedFields = {};
  
        for (const key in questions) {
          if (questions[key].category === oldCategory) {
            updatedFields[`questions.${key}.isUse`] = isUse;
          }
        }
  
        const result = await db.collection('rooms').updateOne(
          { roomNumber: roomId },
          { $set: updatedFields }
        );
  
        if (result.modifiedCount > 0) {
          res.status(200).json({ message: 'เปลี่ยนแปลงสำเร็จ' });
        } else {
          res.status(400).json({ message: 'ไม่ได้เปลี่ยน' });
        }
      } else {
        res.status(404).json({ message: 'Room not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
}
