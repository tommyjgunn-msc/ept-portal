// pages/api/test-delivery.js — Serve test questions (answers stripped)
import { getGoogleSheets } from '../../utils/googleSheets';
import { withAuth } from '../../utils/withAuth';
import { RANGES } from '../../utils/sheetSchema';

function convertDateFormat(bookingDate) {
  const cleanDate = bookingDate.replace(/^'|'$/g, '');
  const monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  const parts = cleanDate.split(', ')[1].split(' ');
  const day = parts[0];
  const month = monthMap[parts[1]];
  const year = new Date().getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Strip answer data from questions before sending to client.
 * Questions sheet columns: [0:Test_ID, 1:Section, 2:Title, 3:Content, 4:QuestionNum, 5:QuestionText, 6:Options, 7:CorrectAnswer, 8:Points]
 * We remove index 7 (CorrectAnswer) and keep Points for display only.
 */
function stripAnswers(questions) {
  return questions.map(row => {
    const stripped = [...row];
    // Replace correct answer column with empty string
    if (stripped.length > 7) {
      stripped[7] = '';
    }
    return stripped;
  });
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'Only GET requests are allowed' });
  }

  let { date, type, student_id } = req.query;

  if (!date || !type || !student_id) {
    return res.status(400).json({ error: 'missing_params', message: 'Date, type, and student ID are required' });
  }

  // Validate type
  if (!['reading', 'writing', 'listening'].includes(type)) {
    return res.status(400).json({ error: 'invalid_type', message: 'Invalid test type' });
  }

  // Validate student_id — allow alphanumeric and common ID characters
  if (!/^[a-zA-Z0-9_-]+$/.test(student_id)) {
    return res.status(400).json({ error: 'invalid_student_id', message: 'Student ID contains invalid characters' });
  }

  const convertedDate = convertDateFormat(date);

  const sheets = await getGoogleSheets();

  const ranges = [RANGES.SUBMISSIONS_PORTAL, RANGES.TESTS, RANGES.WRITING_PROMPTS, RANGES.QUESTIONS];
  const batchResponse = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    ranges,
  });

  const [submissionsResponse, testResponse, promptsResponse, questionsResponse] = batchResponse.data.valueRanges;

  // Check if already submitted
  const submissions = submissionsResponse.values || [];
  const testSubmissions = submissions.filter(row => {
    const submissionType = row[0].split('_')[0];
    return row[1] === student_id && submissionType === type;
  });

  if (testSubmissions.length > 0) {
    return res.status(403).json({
      error: 'already_submitted',
      message: 'You have already taken this test',
      submission: { date: testSubmissions[0][5], score: testSubmissions[0][2] },
    });
  }

  // Find test for date
  const test = testResponse.values?.find(row => row[5] === convertedDate && row[1] === type);
  if (!test) {
    return res.status(404).json({ message: 'Test not found' });
  }

  const test_id = test[0];
  let content;

  if (type === 'writing') {
    content = promptsResponse.values?.filter(row => row[0] === test_id);
  } else {
    // SECURITY: Strip correct answers before sending to client
    const rawQuestions = questionsResponse.values?.filter(row => row[0] === test_id) || [];
    content = stripAnswers(rawQuestions);
  }

  return res.status(200).json({
    test_id,
    type,
    content,
    total_points: test[6],
  });
}

export default withAuth(handler);
