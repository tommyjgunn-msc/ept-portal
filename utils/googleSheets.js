// utils/googleSheets.js
import { google } from 'googleapis';
import { RANGES } from './sheetSchema';

export async function getGoogleSheets() {
  const private_key = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : '';

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function testConnection() {
  try {
    const sheets = await getGoogleSheets();
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    return {
      success: true,
      spreadsheetTitle: metadata.data.properties.title,
      sheets: metadata.data.sheets.map(s => s.properties.title),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function verifyEptId(eptId) {
  const sheets = await getGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.AUTH,
  });

  const rows = response.data.values || [];
  const user = rows.find(row => row[2] === eptId);

  if (!user) return null;

  return {
    name: user[0],
    email: user[1],
    eptId: user[2],
  };
}

export async function getAvailableDates() {
  const sheets = await getGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.BOOKINGS,
  });

  const bookings = response.data.values || [];
  return bookings.reduce((acc, [,,, hasLaptop, date]) => {
    const cleanDate = date ? date.replace(/^'|'$/g, '').trim() : '';
    if (!cleanDate) return acc;

    if (!acc[cleanDate]) {
      acc[cleanDate] = { withLaptop: 0, withoutLaptop: 0 };
    }
    if (hasLaptop === 'Yes') {
      acc[cleanDate].withLaptop++;
    } else {
      acc[cleanDate].withoutLaptop++;
    }
    return acc;
  }, {});
}

export async function createBooking(bookingData) {
  const formattedDate = bookingData.selectedDate
    ? `'${bookingData.selectedDate}'`
    : '';

  const sheets = await getGoogleSheets();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.BOOKINGS,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        bookingData.name,
        bookingData.email,
        bookingData.eptId,
        bookingData.hasLaptop ? 'Yes' : 'No',
        formattedDate,
      ]],
    },
  });

  return {
    success: true,
    range: response.data.updates.updatedRange,
    data: bookingData,
  };
}

export async function getBookingsCount() {
  const sheets = await getGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.BOOKINGS,
  });

  const bookings = response.data.values || [];
  return bookings.reduce((acc, [,,, hasLaptop, date]) => {
    const cleanDate = date ? date.replace(/^'|'$/g, '').trim() : '';
    if (!cleanDate) return acc;

    if (!acc[cleanDate]) {
      acc[cleanDate] = { withLaptop: 0, withoutLaptop: 0 };
    }
    if (hasLaptop === 'Yes') {
      acc[cleanDate].withLaptop++;
    } else {
      acc[cleanDate].withoutLaptop++;
    }
    return acc;
  }, {});
}

// Admin-managed bookable test dates. Written by admin-ept.
// Columns: A id | B date_iso | C venues | D cap_with_laptop
//          E cap_without_laptop | F status | G updated_by | H updated_at
export async function getTestDates() {
  const sheets = await getGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.TEST_DATES,
  });

  return (response.data.values || [])
    .filter(row => row[1] && String(row[5] || 'published').trim() === 'published')
    .map(row => ({
      id: row[0] || '',
      date_iso: String(row[1]).replace(/^'|'$/g, '').trim(),
      venues: Number(row[2]) || 4,
      capacity: {
        withLaptop: Number(row[3]) || 0,
        withoutLaptop: Number(row[4]) || 0,
      },
    }));
}

export async function getTestForDate(date) {
  const testDate = new Date(date);
  const dateString = `${testDate.getFullYear()}${String(testDate.getMonth() + 1).padStart(2, '0')}${String(testDate.getDate()).padStart(2, '0')}`;

  const testIds = [
    `reading_${dateString}`,
    `listening_${dateString}`,
    `writing_${dateString}`,
  ];

  const sheets = await getGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.TESTS,
  });

  const tests = response.data.values || [];
  return tests.filter(test => testIds.includes(test[0]));
}
