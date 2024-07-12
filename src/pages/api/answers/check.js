import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, question, email,rules } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('test');
    const emailKey = email.replace(/\./g, '_');

    if(rules == "reset"){
      // ลบคำตอบเมื่อทำเครื่องหมายว่าได้รับการตรวจสอบแล้ว
      await db.collection('answers').updateOne(
        { roomId },
        { $unset: { [`${question}.${emailKey}`]: "" } }
      );
    }else {
      // อัปเดตสถานะการตรวจสอบใน MongoDB
    await db.collection('answers').updateOne(
      { roomId },
      { $set: { [`${question}.${emailKey}.checked`]: true } },
      { upsert: true }
    );
    }
    

    // console.log("index", index);
    // console.log("q", question);

    res.status(200).json({ message: 'Answer marked as checked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
