// pages/api/test-connection.js
import { testConnection } from '../../utils/googleSheets';

export default async function handler(req, res) {
  try {
    console.log('Test endpoint called');
    const result = await testConnection();
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}