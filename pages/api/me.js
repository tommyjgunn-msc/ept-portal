// pages/api/me.js — Returns current user from session cookie
import { withAuth } from '../../utils/withAuth';
import { generateCsrfToken } from '../../utils/session';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // req.user is set by withAuth middleware
  return res.status(200).json({
    ...req.user,
    csrfToken: generateCsrfToken(req.sessionToken),
  });
}

export default withAuth(handler);
