import clientPromise from '../../lib/mongodb';

function generateRandomRoomNumber() {
  const min = 10000;
  const max = 99999;
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { originalRoomNumber, userHost } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('test');
    const roomsCollection = db.collection('rooms');

    // ค้นหาห้องเดิม
    const originalRoom = await roomsCollection.findOne({ roomNumber: originalRoomNumber, userHost: userHost });
    if (!originalRoom) {
      return res.status(404).json({ message: 'Original room not found' });
    }

    // สร้างห้องใหม่โดยคัดลอกข้อมูลจากห้องเดิม
    let newRoom = { ...originalRoom };
    delete newRoom._id; // ลบ _id เพื่อให้ MongoDB สร้าง _id ใหม่
    delete newRoom.roomNumber; // ลบ roomNumber เดิม
    delete newRoom.Created; // ลบ Created เดิม
    delete newRoom.users; // ลบ users เดิม
    delete newRoom.scores; // ลบ scoresเดิม

    // สร้าง roomNumber ใหม่ที่ไม่ซ้ำ
    let newRoomNumber;
    let existingRoom;
    do {
      newRoomNumber = generateRandomRoomNumber();
      existingRoom = await roomsCollection.findOne({ roomNumber: newRoomNumber, userHost: userHost });
    } while (existingRoom);

    // เพิ่ม roomNumber ใหม่ และ Created
    const currentDate = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
    newRoom.roomNumber = newRoomNumber;
    newRoom.Created = currentDate;

    // เพิ่มห้องใหม่ลงในฐานข้อมูล
    const result = await roomsCollection.insertOne(newRoom);

    if (result.insertedId) {
      res.status(200).json({ message: `Room ${originalRoomNumber} copied to ${newRoomNumber} successfully`,newRoomNumber });
    } else {
      res.status(400).json({ message: 'Failed to copy room' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}