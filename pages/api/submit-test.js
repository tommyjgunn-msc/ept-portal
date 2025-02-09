// pages/api/submit-test.js
import { getGoogleSheets } from '../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { test_id, responses, student_id } = req.body;
    
    // Validate required fields
    if (!test_id || !responses || !student_id) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'All fields are required'
      });
    }

    // Extract type from test_id
    const type = test_id.split('_')[0];
    
    const sheets = await getGoogleSheets();

    // Check for existing submissions
    const submissionsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Submissions!A2:G'
    });

    const submissions = submissionsResponse.data.values || [];
    const existingSubmissions = submissions.filter(row => 
      row[0] === test_id && row[1] === student_id
    );

    if (existingSubmissions.length > 0) {
      return res.status(403).json({
        error: 'already_submitted',
        message: 'You have already submitted this test',
        submission: {
          date: existingSubmissions[0][5],
          score: existingSubmissions[0][2]
        }
      });
    }

    // Calculate score based on test type
    let score = null; // Default to null for writing tests
    
    if (type !== 'writing') {
      const testResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Questions!A2:I'
      });
    
      const testContent = testResponse.data.values.filter(row => row[0] === test_id);
      
      score = testContent.reduce((total, question) => {
        const questionId = `${question[1]}-${question[4]}`; // section-question format
        const response = responses[questionId];
        const correctAnswer = question[7]; // This is column H, which has correct answer
        const points = parseInt(question[8]) || 0; // This is column I, which has points
        
        // Normalize both strings for comparison
        const normalizedResponse = String(response).trim();
        const normalizedCorrectAnswer = String(correctAnswer).trim();
        
        return total + (normalizedResponse === normalizedCorrectAnswer ? points : 0);
      }, 0);
    }

    // Record submission
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Submissions!A2:G',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          test_id,
          student_id,
          score,
          'true', // completed
          JSON.stringify(responses),
          new Date().toISOString(), // submission_date
          type
        ]]
      }
    });

    return res.status(200).json({
      message: 'Test submitted successfully',
      score,
      type
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    return res.status(500).json({
      error: 'submission_failed',
      message: 'Failed to submit test',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}