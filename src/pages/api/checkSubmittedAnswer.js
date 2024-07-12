// pages/api/checkSubmittedAnswer.js
import clientPromise from '../../lib/mongodb';

function parseCode(code) {
  const lines = code.split('\n');
  const variables = {};

  lines.forEach(line => {
    if (line.includes('=') && !line.trim().startsWith('print')) {
      const [varName, varValue] = line.split('=').map(part => part.trim());
      variables[varName] = varValue;
    }
  });

  Object.keys(variables).forEach(varName => {
    if (variables[varName].includes('-') || variables[varName].includes('+')) {
      variables[varName] = eval(variables[varName].replace(/[a-zA-Z]/g, match => variables[match] || match));
    }
  });

  return variables;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomId, examId, email } = req.query;
    const client = await clientPromise;
    const db = client.db("test");

    // console.log('Query params:', { roomId, examId, email });

    const submittedAnswer = await db.collection("answers").findOne({ roomId });
    // console.log('submittedAnswer:', submittedAnswer);

    const room = await db.collection("rooms").findOne({ roomNumber: roomId });
    // console.log('room:', room);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    let questions = room.questions;
    if (!Array.isArray(questions)) {
      questions = Object.values(questions);
    }

    // console.log('questions:', questions);

    const question = questions.find(q => q.exam === examId);
    // console.log('question:', question);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (!question.code) {
      // console.error('Question code is undefined');
      return res.status(305).json({ message: 'Question code is missing' });
    }

    if (submittedAnswer && submittedAnswer[examId]) {
      const cleanEmail = email.replace(/\./g, '_');
      // console.log('cleanEmail:', cleanEmail);
      const userAnswer = submittedAnswer[examId][cleanEmail];
      // console.log('userAnswer:', userAnswer);

      if (userAnswer) {
        const correct = parseCode(question.code);
        const answer = parseCode(userAnswer.code);
        const scores = question.variableScores || {};

        let correctCount = 0;
        let totalScore = 0;

        Object.keys(correct).forEach(key => {
          if (key in answer && correct[key] === answer[key]) {
            correctCount++;
            totalScore += scores[key] || 0;
          }
        });

        return res.status(200).json({ 
          submitted: true, 
          score: userAnswer.score,
          correctCount: correctCount,
          totalScore: totalScore,
          totalQuestions: Object.keys(correct).length,
          maxScore: userAnswer.totalScore || 0
        });
      } else {
        return res.status(302).json({ message: 'User answer not found' });
      }
    } else {
      const correct = parseCode(question.code);
      const scores = question.variableScores || {};

      return res.status(200).json({ 
        submitted: false,
        totalQuestions: Object.keys(correct).length,
        maxScore: Object.values(scores).reduce((sum, value) => sum + value, 0)
      });
    }
  } catch (error) {
    console.error('Error checking submitted answer:', error);
    return res.status(500).json({ message: 'Error checking submitted answer' });
  }
}
