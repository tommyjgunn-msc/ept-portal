import { getGoogleSheets } from '../../utils/googleSheets';

/**
 * Delivers test content to students based on date, type, and student ID.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - Test content or error message.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    const { date, type, student_id } = req.query;

    // Validate inputs
    if (!date || !type || !student_id) {
      return res.status(400).json({
        error: 'missing_params',
        message: 'Date, type, and student ID are required'
      });
    }

    // Validate student_id format
    if (!/^[a-zA-Z0-9]+$/.test(student_id)) {
      return res.status(400).json({
        error: 'invalid_student_id',
        message: 'Student ID must be alphanumeric'
      });
    }

    const sheets = await getGoogleSheets();

    // Batch fetch data from Google Sheets
    const ranges = ['Submissions!A2:G', 'Tests!A2:G', 'WritingPrompts!A2:E', 'Questions!A2:I'];
    const batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      ranges,
    });

    const [submissionsResponse, testResponse, promptsResponse, questionsResponse] = batchResponse.data.valueRanges;

    // Check for existing submissions
    const submissions = submissionsResponse.values || [];
    const testSubmissions = submissions.filter(row => {
      const submissionType = row[0].split('_')[0]; // Extract type from test_id
      return row[1] === student_id && submissionType === type;
    });

    if (testSubmissions.length > 0) {
      return res.status(403).json({
        error: 'already_submitted',
        message: 'You have already taken this test',
        submission: {
          date: testSubmissions[0][5], // submission_date
          score: testSubmissions[0][2], // score
        }
      });
    }

    // Find test for this date and type
    const test = testResponse.values?.find(row => row[5] === date && row[1] === type);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Get test content based on type
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