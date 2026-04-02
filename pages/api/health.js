// pages/api/health.js — Health check endpoint
import { testConnection } from '../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    environment: {
      hasServiceEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
    },
    sheets: null,
  };

  try {
    const sheetsResult = await testConnection();
    checks.sheets = {
      connected: sheetsResult.success,
      title: sheetsResult.spreadsheetTitle || null,
      tabs: sheetsResult.sheets || [],
    };

    // Verify required tabs exist
    const requiredTabs = ['Auth', 'Bookings', 'Tests', 'Questions', 'WritingPrompts', 'Submissions'];
    const missingTabs = requiredTabs.filter(tab => !checks.sheets.tabs.includes(tab));
    if (missingTabs.length > 0) {
      checks.sheets.missingTabs = missingTabs;
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.sheets = { connected: false, error: 'Connection failed' };
    checks.status = 'error';
  }

  const statusCode = checks.status === 'ok' ? 200 : checks.status === 'degraded' ? 200 : 503;
  return res.status(statusCode).json(checks);
}
