import { getGoogleSheets } from '../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({
        error: 'missing_student_id',
        message: 'Student ID is required'
      });
    }

    const sheets = await getGoogleSheets();

    // Batch fetch data
    const [submissionsResponse, testsResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Submissions!A2:G',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Tests!A2:G',
      }),
    ]);

    const submissions = submissionsResponse.data.values || [];
    const tests = testsResponse.data.values || [];
    const userSubmissions = submissions.filter(row => row[1] === student_id);
    const results = {};

    for (const submission of userSubmissions) {
      const [test_id, , score, completed, responses, submission_date, submission_count] = submission;
      const type = test_id.split('_')[0];
      const test = tests.find(row => row[0] === test_id);

      // Parse values safely
      const parsedScore = parseInt(score) || 0;
      const parsedTotalPoints = test ? parseInt(test[6]) || 0 : 0;

      // Safely parse responses
      let parsedResponses = [];
      try {
        parsedResponses = JSON.parse(responses || '[]');
      } catch (e) {
        console.error('Failed to parse responses:', e);
      }

      // Update results only if newer submission
      if (!results[type] || parseInt(submission_count) > parseInt(results[type].submission_count)) {
        results[type] = {
          score: parsedScore,
          total_points: parsedTotalPoints,
          completed: completed === 'true',
          submission_date,
          submission_count,
          responses: parsedResponses,
        };
      }
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error('Error fetching test results:', error);
    return res.status(500).json({
      error: 'fetch_failed',
      message: 'Failed to fetch test results'
    });
  }
}