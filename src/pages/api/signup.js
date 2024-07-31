import Cookies from 'cookies'
import clientPromise from "../../lib/mongodb.js";
const { createHash } = require('node:crypto');

export default async function handler(req, res) {
  if (req.method == "POST") {
    const email = req.body['email']
    const password = req.body['password']
    const passwordagain = req.body['passwordagain']
    
    // Check if email contains @ symbol
    if (!email.includes('@')) {
      res.redirect("/signup?msg=Please enter a valid email address");
      return;
    }

    if (password != passwordagain){
      res.redirect("/signup?msg=The two passwords don't match");
      return;
    }
    const client = await clientPromise;
    const db = client.db("Users");
    const users = await db.collection("Profiles").find({"Email": email}).toArray();
    if (users.length > 0){
      res.redirect("/signup?msg=A user already has this email");
      return;
    }
    const password_hash = createHash('sha256').update(password).digest('hex');
    const currentDate = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
    const bodyObject = {
      Email: email,
      Password: password_hash,
      Created: currentDate
    }
    await db.collection("Profiles").insertOne(bodyObject);
    const cookies = new Cookies(req, res)
    cookies.set('email', email)
    res.redirect("/")
  } else {
    res.redirect("/")
  }
}
