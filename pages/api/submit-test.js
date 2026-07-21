// pages/api/submit-test.js — Receive and score test submissions (authenticated)
import { getGoogleSheets } from '../../utils/googleSheets';
import { calculateTestScore } from '../../utils/testScoring';
import { withAuth } from '../../utils/withAuth';
import { validateSubmission } from '../../utils/validation';
import { RANGES } from '../../utils/sheetSchema';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { test_id, responses, student_id, type, proctoring_data } = req.body;

  const validation = validateSubmission({ test_id, responses, student_id, type });
  if (!validation.valid) {
    return res.status(400).json({ error: 'invalid_data', message: 'Invalid submission data', errors: validation.errors });
  }

  const sheets = await getGoogleSheets();

  // Check for duplicate submission
  const existingSubmissionResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.SUBMISSIONS_PORTAL,
  });

  const existingSubmissions = existingSubmissionResponse.data.values || [];
  const hasSubmitted = existingSubmissions.some(row => row[0] === test_id && row[1] === student_id);

  if (hasSubmitted) {
    return res.status(409).json({ error: 'already_submitted', message: 'Test has already been submitted' });
  }

  // Score the test (server-side only — answers never sent to client)
  let scoreData = { score: null, totalPoints: null, percentage: null };
  if (type !== 'writing') {
    const questionsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: RANGES.QUESTIONS,
    });

    const testQuestions = (questionsResponse.data.values || []).filter(row => row[0] === test_id);
    if (testQuestions.length > 0) {
      scoreData = calculateTestScore(testQuestions, responses);
    }
  }

  // Evaluate proctoring flags
  const proctoringFlag = proctoring_data && (
    (proctoring_data.warnings?.fullscreen > 1) ||
    (proctoring_data.warnings?.windowFocus > 1) ||
    (proctoring_data.warnings?.copyPaste > 0) ||
    proctoring_data.warnings?.multipleMonitors ||
    proctoring_data.shouldForceSubmit
  ) ? 'YES' : 'NO';

  const submissionRow = [
    test_id,
    student_id,
    scoreData.score,
    'true',
    JSON.stringify(responses),
    new Date().toISOString(),
    type,
    scoreData.totalPoints,
    scoreData.percentage,
    proctoringFlag,
    proctoring_data ? JSON.stringify(proctoring_data) : '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGES.SUBMISSIONS_PORTAL,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [submissionRow] },
  });

  return res.status(200).json({
    message: 'Test submitted successfully',
    ...scoreData,
    type,
    proctoring_flag: proctoringFlag,
  });
}

export default withAuth(handler);
