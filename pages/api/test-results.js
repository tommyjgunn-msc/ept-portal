// pages/api/test-results.js — Get student results (authenticated)
import { getGoogleSheets } from '../../utils/googleSheets';
import { withAuth } from '../../utils/withAuth';
import { validateEptId } from '../../utils/validation';
import { RANGES } from '../../utils/sheetSchema';

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
      range: RANGES.SUBMISSIONS_PORTAL,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: RANGES.TESTS,
    }),
  ]);

  const submissions = submissionsResponse.data.values || [];
  const tests = testsResponse.data.values || [];
  const userSubmissions = submissions.filter(row => row[1] === validation.value);
  const results = {};

  for (const submission of userSubmissions) {
    // Submissions column G holds the section type, not a submission count —
    // the sheet's own header cell mislabels it "submission_count", and this
    // code inherited that mistake. It used to destructure G as a count and
    // compare parseInt('reading') > parseInt('reading'), which is NaN > NaN,
    // i.e. always false: on a retake the FIRST attempt was kept and the page
    // rendered "Attempt reading". Retakes now resolve by submission date.
    const [test_id, , score, completed, responses, submission_date] = submission;
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

    const isNewer = !results[type] ||
      String(submission_date || '') >= String(results[type].submission_date || '');

    if (isNewer) {
      results[type] = {
        score: parsedScore,
        total_points: parsedTotalPoints,
        completed: completed === 'true',
        submission_date,
        attempts: (results[type]?.attempts || 0) + 1,
        responses: parsedResponses,
      };
    } else if (results[type]) {
      results[type].attempts += 1;
    }
  }

  return res.status(200).json(results);
}

export default withAuth(handler);
