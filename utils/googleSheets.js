// utils/googleSheets.js
import { google } from 'googleapis';

export async function getGoogleSheets() {
  try {
    console.log('Initializing Google Sheets client...');
    
    const private_key = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
      : '';

    console.log('Credential check:', {
      hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!private_key,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      keyLength: private_key.length
    });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: private_key
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error in getGoogleSheets:', error);
    throw error;
  }
}

export async function testConnection() {
  try {
    console.log('Starting connection test...');
    const sheets = await getGoogleSheets();
    
    console.log('Attempting to fetch spreadsheet...', {
      sheetId: process.env.GOOGLE_SHEET_ID
    });

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    console.log('Connection successful!', {
      spreadsheetTitle: metadata.data.properties.title,
      sheetCount: metadata.data.sheets.length,
      sheets: metadata.data.sheets.map(s => s.properties.title)
    });

    return {
      success: true,
      spreadsheetTitle: metadata.data.properties.title,
      sheets: metadata.data.sheets.map(s => s.properties.title)
    };
  } catch (error) {
    console.error('Connection test failed:', {
      message: error.message,
      details: error.response?.data || 'No additional details'
    });
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details'
    };
  }
}

export async function verifyEptId(eptId) {
  try {
    console.log('Verifying EPT ID:', eptId);
    
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Auth!A2:C',
    });

    console.log('Auth sheet response:', {
      hasValues: !!response.data.values,
      rowCount: response.data.values?.length || 0
    });

    const rows = response.data.values || [];
    const user = rows.find(row => row[2] === eptId);

    if (!user) {
      console.log('No user found with EPT ID:', eptId);
      return null;
    }

    return {
      name: user[0],
      email: user[1],
      eptId: user[2]
    };
  } catch (error) {
    console.error('Error in verifyEptId:', error);
    throw error;
  }
}

export async function getAvailableDates() {
  try {
    console.log('Fetching available dates...');
    
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!A2:F',
    });

    const bookings = response.data.values || [];
    console.log('Current bookings count:', bookings.length);

    const dateStats = bookings.reduce((acc, [,,, isRefugee, hasLaptop, date]) => {
      if (!acc[date]) {
        acc[date] = { withLaptop: 0, withoutLaptop: 0 };
      }
      if (hasLaptop === 'Yes') {
        acc[date].withLaptop++;
      } else {
        acc[date].withoutLaptop++;
      }
      return acc;
    }, {});

    console.log('Date statistics:', dateStats);
    return dateStats;
  } catch (error) {
    console.error('Error in getAvailableDates:', error);
    throw error;
  }
}

export async function createBooking(bookingData) {
  try {
    console.log('Creating booking:', bookingData);
    
    const formattedDate = bookingData.selectedDate
      ? `'${bookingData.selectedDate}'`  
      : '';

    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!A2:F',
      valueInputOption: 'RAW', 
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          bookingData.name,
          bookingData.email,
          bookingData.eptId,
          bookingData.isRefugee ? 'Yes' : 'No',
          bookingData.hasLaptop ? 'Yes' : 'No',
          formattedDate,
        ]],
      },
    });

    console.log('Booking created successfully');
    return response.data;
  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
}

export async function getBookingsCount() {
  try {
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!A2:F',
    });
    
    const bookings = response.data.values || [];
    const counts = {};
    
    bookings.forEach(booking => {
      // Get the raw date string from the booking
      const selectedDate = booking[5].replace(/^'/, '').replace(/'$/, ''); // Remove any single quotes
      console.log('Processing booking date:', selectedDate); // Debug log
      
      if (!counts[selectedDate]) {
        counts[selectedDate] = { withLaptop: 0, withoutLaptop: 0 };
      }
    
      if (booking[4] === 'Yes') {
        counts[selectedDate].withLaptop++;
      } else {
        counts[selectedDate].withoutLaptop++;
      }
    });

    console.log('Current counts:', counts); // Debug log
    return counts;
  } catch (error) {
    console.error('Error getting booking counts:', error);
    throw error;
  }
}

export async function getTestForDate(date) {
  try {
    const testDate = new Date(date);
    const dateString = `${testDate.getFullYear()}${String(testDate.getMonth() + 1).padStart(2, '0')}${String(testDate.getDate()).padStart(2, '0')}`;
    
    const testIds = [
      `reading_${dateString}`,
      `listening_${dateString}`,
      `writing_${dateString}`
    ];

    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Tests!A2:G',
    });

    const tests = response.data.values || [];
    // Find tests matching our testIds
    const todaysTests = tests.filter(test => testIds.includes(test[0])); // test[0] is test_id

    return todaysTests;
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw error;
  }
}