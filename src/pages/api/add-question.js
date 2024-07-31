import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, name, exam, detel, category, code, testCase, expectedResults } = req.body;

  // Use let instead of const for variables that might need reassignment
  let finalCode = code || "";
  let finalTestCase = testCase || "";
  let finalExpectedResults = expectedResults || "";

  // If any of them is empty, set all to ""
  if (!finalCode || !finalTestCase || !finalExpectedResults) {
    finalCode = finalTestCase = finalExpectedResults = "";
  }

  try {
    const client = await clientPromise;
    const db = client.db('test');
    const currentDate = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

    const result = await db.collection('rooms').updateOne(
      { roomNumber: roomId },
      { 
        $push: { 
          questions: {
            exam: String(exam),
            name,
            detel,
            category,
            createdAt: currentDate,
            isUse: false,
            code: finalCode,
            testCase: finalTestCase,
            expectedResults: finalExpectedResults,
          }
        }
      },
      { upsert: true }
    );

    if (result.modifiedCount === 1 || result.upsertedCount === 1) {
      res.status(200).json({ message: `Question saved successfully N:${name} E:${exam} C:${category}` });
    } else {
      res.status(400).json({ message: 'Failed to save question' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
