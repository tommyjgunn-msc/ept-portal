// pages/api/auth.js
import { verifyEptId } from '../../utils/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Auth endpoint called with:', req.body);
    const { eptId } = req.body;

    if (!eptId) {
      return res.status(400).json({ message: 'EPT ID is required' });
    }

    const user = await verifyEptId(eptId);
    console.log('Verification result:', user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid EPT ID' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}