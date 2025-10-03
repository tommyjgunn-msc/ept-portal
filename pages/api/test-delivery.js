// pages/api/test-delivery.js
import { getGoogleSheets } from '../../utils/googleSheets';

function convertDateFormat(bookingDate) {
  // Convert "Friday, 03 October" to "2025-10-03"
  const monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  
  const parts = bookingDate.split(', ')[1].split(' '); // ["03", "October"]
  const day = parts[0];
  const month = monthMap[parts[1]];
  const year = new Date().getFullYear();
  
  return `${year}-${month}-${day}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    let { date, type, student_id } = req.query;

    if (!date || !type || !student_id) {
      return res.status(400).json({
        error: 'missing_params',
        message: 'Date, type, and student ID are required'
      });
    }

    if (!/^[a-zA-Z0-9]+$/.test(student_id)) {
      return res.status(400).json({
        error: 'invalid_student_id',
        message: 'Student ID must be alphanumeric'
      });
    }

    // Convert date from booking format to Tests sheet format
    const convertedDate = convertDateFormat(date);
    console.log('Date conversion:', { original: date, converted: convertedDate });

    const sheets = await getGoogleSheets();

    const ranges = ['Submissions!A2:G', 'Tests!A2:G', 'WritingPrompts!A2:E', 'Questions!A2:I'];
    const batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      ranges,
    });

    const [submissionsResponse, testResponse, promptsResponse, questionsResponse] = batchResponse.data.valueRanges;

    const submissions = submissionsResponse.values || [];
    const testSubmissions = submissions.filter(row => {
      const submissionType = row[0].split('_')[0];
      return row[1] === student_id && submissionType === type;
    });

    if (testSubmissions.length > 0) {
      return res.status(403).json({
        error: 'already_submitted',
        message: 'You have already taken this test',
        submission: {
          date: testSubmissions[0][5],
          score: testSubmissions[0][2],
        }
      });
    }

    const test = testResponse.values?.find(row => row[5] === convertedDate && row[1] === type);
    
    if (!test) {
      console.error('Test not found:', { 
        searchDate: convertedDate, 
        searchType: type,
        availableTests: testResponse.values?.map(row => ({ 
          date: row[5], 
          type: row[1] 
        })) 
      });
      return res.status(404).json({ message: 'Test not found' });
    }

    const test_id = test[0];
    let content;

    if (type === 'writing') {
      content = promptsResponse.values?.filter(row => row[0] === test_id);
    } else {
      content = questionsResponse.values?.filter(row => row[0] === test_id);
    }

    return res.status(200).json({
      test_id,
      type,
      content,
      total_points: test[6]
    });

  } catch (error) {
    console.error('Error in test delivery:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'sheet_not_found',
        message: 'The requested Google Sheet was not found'
      });
    }
    return res.status(500).json({
      error: 'delivery_failed',
      message: 'Failed to deliver test'
    });
  }
}
