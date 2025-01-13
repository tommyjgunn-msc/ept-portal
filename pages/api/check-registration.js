// pages/api/check-registration.js
import { getGoogleSheets } from '../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eptId } = req.body;
    const sheets = await getGoogleSheets();
    
    // Check Bookings sheet for existing registration
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!A2:F',
    });

    const bookings = response.data.values || [];
    const existingBooking = bookings.find(booking => booking[2] === eptId); // Assuming EPTID is in column C

    if (existingBooking) {
      return res.status(200).json({
        hasRegistration: true,
        registration: {
          name: existingBooking[0],
          email: existingBooking[1],
          eptId: existingBooking[2],
          isRefugee: existingBooking[3] === 'Yes',
          hasLaptop: existingBooking[4] === 'Yes',
          selectedDate: existingBooking[5]
        }
      });
    }

    return res.status(200).json({ hasRegistration: false });
  } catch (error) {
    console.error('Error checking registration:', error);
    return res.status(500).json({ message: 'Failed to check registration' });
  }
}