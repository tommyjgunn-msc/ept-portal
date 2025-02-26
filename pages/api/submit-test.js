// pages/api/submit-test.js
import { getGoogleSheets } from '../../utils/googleSheets';
import { calculateTestScore } from '../../utils/testScoring';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const { test_id, responses, student_id, type, proctoring_data } = req.body;
    
    console.log('Processing test submission:', {
      test_id,
      type,
      student_id,
      responseCount: Object.keys(responses).length,
      hasProctoring: !!proctoring_data
    });

    if (proctoring_data) {
      console.log('Proctoring data summary:', {
        fullscreenWarnings: proctoring_data.warnings?.fullscreen,
        windowFocusWarnings: proctoring_data.warnings?.windowFocus,
        copyPasteAttempts: proctoring_data.warnings?.copyPaste,
        multipleMonitors: proctoring_data.warnings?.multipleMonitors,
        focusEventsCount: proctoring_data.focusEvents?.length,
        forcedSubmission: proctoring_data.shouldForceSubmit
      });
    }

    if (!test_id || !responses || !student_id || !type) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Missing required submission data'
      });
    }

    const sheets = await getGoogleSheets();
    const existingSubmissionResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Submissions!A2:G'
    });

    const existingSubmissions = existingSubmissionResponse.data.values || [];
    const hasSubmitted = existingSubmissions.some(row =>
      row[0] === test_id && row[1] === student_id
    );

    if (hasSubmitted) {
      return res.status(409).json({
        error: 'already_submitted',
        message: 'Test has already been submitted'
      });
    }

    let scoreData = { score: null, totalPoints: null, percentage: null };
    if (type !== 'writing') {
      const questionsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Questions!A2:I'
      });

      const testQuestions = (questionsResponse.data.values || [])
        .filter(row => row[0] === test_id);

      console.log(`Found ${testQuestions.length} questions for test ${test_id}`);

      if (testQuestions.length > 0) {
        scoreData = calculateTestScore(testQuestions, responses);
        console.log('Calculated score:', scoreData);
      } else {
        console.warn('No questions found for test:', test_id);
      }
    }

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
      proctoring_data ? JSON.stringify(proctoring_data) : '' 
    ];

    console.log('Saving submission row with proctoring data');

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Submissions!A2:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [submissionRow]
      }
    });

    return res.status(200).json({
      message: 'Test submitted successfully',
      ...scoreData,
      type,
      proctoring_flag: proctoringFlag
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return res.status(500).json({
      error: 'submission_failed',
      message: error.message || 'Failed to submit test'
    });
  }
}