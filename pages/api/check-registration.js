// pages/api/check-registration.js — Check if student has a booking (authenticated)
import { getGoogleSheets } from '../../utils/googleSheets';
import { withAuth } from '../../utils/withAuth';
import { validateEptId } from '../../utils/validation';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { eptId } = req.body;

  const validation = validateEptId(eptId);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.error });
  }

  const sheets = await getGoogleSheets();

  const [bookingsResponse, submissionsResponse] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!A2:E',
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Submissions!A2:G',
    }),
  ]);

  const bookings = bookingsResponse.data.values || [];
  const existingBooking = bookings.find(booking => booking[2] === validation.value);

  const submissions = submissionsResponse.data.values || [];
  const userSubmissions = submissions.filter(row => row[1] === validation.value);
  const hasCompletedTests = userSubmissions.length > 0;

  if (existingBooking) {
    return res.status(200).json({
      hasRegistration: true,
      hasCompletedTests,
      registration: {
        name: existingBooking[0],
        email: existingBooking[1],
        eptId: existingBooking[2],
        hasLaptop: existingBooking[3] === 'Yes',
        selectedDate: existingBooking[4],
      },
    });
  }

  return res.status(200).json({
    hasRegistration: false,
    hasCompletedTests: false,
  });
}

export default withAuth(handler);
