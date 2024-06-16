// pages/api/checkSyntax.js

import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';
import serviceAccount from '../../../service-account.json'; // Adjust the path if necessary

// Function to get the access token
async function getAccessToken() {
  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const tokens = await client.authorize();
  return tokens.access_token;
}

// Function to trigger the Cloud Function
async function executeCloudFunction(accessToken, code) {
  const response = await fetch('https://us-central1-ptest-424306.cloudfunctions.net/function-1-test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const responseData = await response.text();
  if (!response.ok) {
    console.error('Cloud Function request failed:', response.statusText, responseData);
    throw new Error('Failed to call Cloud Function');
  }

  return JSON.parse(responseData);
}

// Handler for API requests
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { code } = req.body;

    if (!code) {
      return res.status(201).json({ success: false, error: 'กรุณากรอกโค้ด' });
    }

    try {
      const accessToken = await getAccessToken();
      const data = await executeCloudFunction(accessToken, code);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดำเนินการ' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
