import clientPromise from "../../lib/mongodb.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { roomNumber, email } = req.body;

    try {
      const client = await clientPromise;
      const db = client.db("test");

      // ตรวจสอบว่าห้องนี้มีอยู่จริงหรือไม่
      const existingRoom = await db.collection("rooms").findOne({ roomNumber });
      if (!existingRoom) {
        return res.status(300).json({ error: "Room not found" });
      }

      // ตรวจสอบว่าอีเมล์นี้เข้าร่วมห้องแล้วหรือยัง
      const userAlreadyJoined = existingRoom.users && existingRoom.users.includes(email);
      if (userAlreadyJoined) {
        return res.status(300).json({ error: "User already joined this room" });
      }

      const hostAlreadyJoined = existingRoom.userHost == email;
      if(hostAlreadyJoined){
        return res.status(300).json({ error: "คุณเป็นหัวห้องอยู่แล้ว" });
      }

      // นับจำนวนผู้ใช้ที่มีในฟิลด์ 'users' ของห้องนี้
      const userCount = existingRoom.users ? existingRoom.users.length : 0;

      // สร้างชื่อผู้ใช้ใหม่โดยใช้รูปแบบ 'User [N]' โดยที่ N เป็นลำดับของผู้ใช้ + 1
      const newUserName = `User [${userCount + 1}]`;
      const currentDate = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
      // อัปเดตห้องใน MongoDB
      await db.collection("rooms").updateOne(
        { roomNumber },
        { 
          $push: { 
            users: email,
            scores: {
              name: newUserName,
              email: email,
              score: 0,
              profileNumber: userCount + 1,
              joinTime:currentDate
            }
          }
        }
      );

      res.status(200).json({ message: "Joined room successfully" });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
