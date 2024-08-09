import Cookies from 'cookies';
import clientPromise from "../../lib/mongodb.js";
const { createHash } = require('node:crypto');

export default async function handler(req, res) {
    if (req.method === "POST") {
        const email = req.body['email'];
        const guess = req.body['password'];
        const client = await clientPromise;
        const db = client.db("Users");
        const users = await db.collection("Profiles").find({ "Email": email }).toArray();

        if (users.length === 0) {
            res.status(200).json({ success: false, message: 'Incorrect email or password' });
            return;
        }

        const user = users[0];
        const guess_hash = createHash('sha256').update(guess).digest('hex');

        if (guess_hash === user.Password) {
            const cookies = new Cookies(req, res);
            cookies.set('email', email);
            res.status(200).json({ success: true, message: 'Logged in successfully' });
        } else {
            res.status(200).json({ success: false, message: 'Incorrect email or password' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Method not allowed' });
    }
}
