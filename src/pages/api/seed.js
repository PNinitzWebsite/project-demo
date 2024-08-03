// pages/api/seed.js
import { MongoClient, ObjectId } from 'mongodb';
import { faker } from '@faker-js/faker';

const url = 'mongodb://localhost:27017';
const dbName = 'test';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

const generateFakeAnswer = (testCase) => ({
  correct: faker.datatype.boolean(),
  expected: faker.datatype.boolean(),
  test_case: testCase,
  your_result: faker.datatype.boolean()
});

const generateFakeUserAnswers = (email) => {
  const sanitizedEmail = email.replace('.', '_');
  return {
    answer: [
      generateFakeAnswer("missing_char('kitten', 1)"),
      generateFakeAnswer("missing_char('kitten', 0)"),
      generateFakeAnswer("missing_char('kitten', 4)"),
      generateFakeAnswer("missing_char('Hi', 0)"),
      generateFakeAnswer("missing_char('Hi', 1)"),
      generateFakeAnswer("missing_char('code', 0)"),
      generateFakeAnswer("missing_char('code', 1)"),
      generateFakeAnswer("missing_char('code', 2)"),
      generateFakeAnswer("missing_char('code', 3)"),
      generateFakeAnswer("missing_char('chocolate', 8)")
    ],
    checked: false,
    code: "def missing_char(str, n):\n  front = str[:n]\n  back = str[n+1:]\n  return front + back",
    correctCount: 10,
    score: 10,
    submittedAt: faker.date.recent().toLocaleString("th-TH"),
    totalQuestions: 10,
    totalScore: 10
  };
};

const generateFakeExam = (email) => ({
    [`1.${email.replace(/\./g, '_')}`]: generateFakeUserAnswers(email),
//   [`2.${email.replace(/\./g, '_')}`]: generateFakeUserAnswers(email),
//   [`3.${email.replace(/\./g, '_')}`]: generateFakeUserAnswers(email),
  roomId: '70469'

});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST requests allowed' });
    return;
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const examsCollection = db.collection('answers');

    const fakeUsers = Array.from({ length: 10 }, () => faker.internet.email());
    const updates = fakeUsers.map(email => ({
      updateOne: {
        filter: { _id: new ObjectId("669e6d79b8441855a6161ad8") },
        update: { $set: generateFakeExam(email) },
        upsert: true
      }
    }));

    const result = await examsCollection.bulkWrite(updates);

    res.status(200).json({ message: 'Database updated successfully', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
}
