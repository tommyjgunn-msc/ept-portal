// pages/api/signout.js — Destroy session and clear cookie
import { withAuth } from '../../utils/withAuth';
import { destroySession, clearSessionCookie, getSessionToken } from '../../utils/session';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = getSessionToken(req);
  destroySession(token);
  clearSessionCookie(res);

  return res.status(200).json({ message: 'Signed out' });
}

// Allow this even without valid session so partial-session users can sign out
export default withAuth(handler, { skipAuth: true });
