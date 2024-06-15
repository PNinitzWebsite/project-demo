import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกโค้ด' });
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

const getAccessToken = async () => {
    const jwtClient = new JWT({
        email: process.env.GCLOUD_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const tokenResponse = await jwtClient.getAccessToken();
    return tokenResponse.token;
};

const executeCloudFunction = async (accessToken, code) => {
    const response = await fetch('https://us-central1-ptest-424306.cloudfunctions.net/function-1-test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ code }),
    });

    const responseData = await response.text();
    if (!response.ok) {
        console.error('Cloud Function request failed:', response.statusText, responseData);
        throw new Error('Failed to call Cloud Function');
    }

    return JSON.parse(responseData);
};
