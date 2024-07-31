import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';
import serviceAccount from '../../../service-account.json'; // Adjust the path if necessary

async function getAccessToken() {
  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const tokens = await client.authorize();
  return tokens.access_token;
}

async function executeCloudFunction(accessToken, code, test_cases, expected_results) {
  const response = await fetch('https://asia-southeast1-rmutr-13791.cloudfunctions.net/check-code', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      code,
      test_cases,
      expected_results
    }),
  });

  const responseData = await response.text();
  if (!response.ok) {
    console.error('Cloud Function request failed:', response.statusText, responseData);
    throw new Error('Failed to call Cloud Function');
  }

  return JSON.parse(responseData);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { code, test_cases, expected_results } = req.body;

    if (!code.trim()) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกโค้ด' });
    }

    try {
      const accessToken = await getAccessToken();
      const data = await executeCloudFunction(accessToken, code, test_cases, expected_results);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดำเนินการ' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
