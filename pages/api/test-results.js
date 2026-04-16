// pages/api/test-results.js — Get student results (authenticated)
import { getGoogleSheets } from '../../utils/googleSheets';
import { withAuth } from '../../utils/withAuth';
import { validateEptId } from '../../utils/validation';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'Only GET requests are allowed' });
  }

  const { student_id } = req.query;

  const validation = validateEptId(student_id);
  if (!validation.valid) {
    return res.status(400).json({ error: 'invalid_student_id', message: validation.error });
  }

  const sheets = await getGoogleSheets();

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
  const userSubmissions = submissions.filter(row => row[1] === validation.value);
  const results = {};

  for (const submission of userSubmissions) {
    const [test_id, , score, completed, responses, submission_date, submission_count] = submission;
    const type = test_id.split('_')[0];
    const test = tests.find(row => row[0] === test_id);

    const parsedScore = parseInt(score) || 0;
    const parsedTotalPoints = test ? parseInt(test[6]) || 0 : 0;

    let parsedResponses = [];
    try {
      parsedResponses = JSON.parse(responses || '[]');
    } catch (e) {
      // Invalid JSON in stored responses — return empty
      parsedResponses = [];
    }

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
}

export default withAuth(handler);
