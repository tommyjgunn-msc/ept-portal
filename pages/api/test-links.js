// pages/api/test-links.js
import { google } from 'googleapis';
import { getGoogleSheets } from '../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'TestLinks!A2:C2',  // Assuming links are in row 2
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No test links found' });
    }

    const [reading, writing, listening] = rows[0];
    return res.status(200).json({
      reading,
      writing,
      listening
    });
  } catch (error) {
    console.error('Error fetching test links:', error);
    return res.status(500).json({ message: 'Failed to fetch test links' });
  }
}