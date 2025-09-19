// pages/api/check-registration.js
import { getGoogleSheets } from '../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eptId } = req.body;
    const sheets = await getGoogleSheets();
    
    const bookingsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!A2:E',
    });

    const bookings = bookingsResponse.data.values || [];
    const existingBooking = bookings.find(booking => booking[2] === eptId);

    const submissionsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Submissions!A2:G',
    });

    const submissions = submissionsResponse.data.values || [];
    const userSubmissions = submissions.filter(row => row[1] === eptId);
    const hasCompletedTests = userSubmissions.length > 0;

    if (existingBooking) {
      const registrationData = {
        name: existingBooking[0],
        email: existingBooking[1],
        eptId: existingBooking[2],
        hasLaptop: existingBooking[3] === 'Yes',
        selectedDate: existingBooking[4]
      };

      return res.status(200).json({
        hasRegistration: true,
        hasCompletedTests,
        registration: registrationData
      });
    }

    return res.status(200).json({ 
      hasRegistration: false,
      hasCompletedTests: false
    });
  } catch (error) {
    console.error('Error checking registration:', error);
    return res.status(500).json({ message: 'Failed to check registration' });
  }
}
