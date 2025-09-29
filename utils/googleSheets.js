// utils/googleSheets.js
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

let authInstance = null;

export async function getGoogleSheets() {
  if (!authInstance) {
    authInstance = new GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }

  return google.sheets({ version: 'v4', auth: authInstance });
}

export async function getBookingsCount() {
  try {
    console.log('Fetching bookings count...');
    
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Bookings!A2:E',
    });

    const bookings = response.data.values || [];
    console.log('Current bookings count:', bookings.length);

    const dateStats = bookings.reduce((acc, [,,, hasLaptop, date]) => {
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
    console.error('Error in getBookingsCount:', error);
    throw error;
  }
}

export async function verifyEptId(eptId) {
  try {
    console.log('Verifying EPT ID:', eptId);
    
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Students!A2:C',
    });

    console.log('Students sheet response:', {
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
      range: 'Bookings!A2:E',
    });

    const bookings = response.data.values || [];
    console.log('Current bookings count:', bookings.length);

    const dateStats = bookings.reduce((acc, [,,, hasLaptop, date]) => {
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
      range: 'Bookings!A2:E',
      valueInputOption: 'RAW', 
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          bookingData.name,
          bookingData.email,
          bookingData.eptId,
          bookingData.hasLaptop ? 'Yes' : 'No',
          formattedDate
        ]]
      }
    });

    console.log('Booking creation response:', response.data);

    return {
      success: true,
      range: response.data.updates.updatedRange,
      data: bookingData
    };
  } catch (error) {
    console.error('Error in createBooking:', error);
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
