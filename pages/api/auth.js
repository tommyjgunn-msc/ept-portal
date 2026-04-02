// pages/api/auth.js — Login: verify EPT ID, create session, set cookie
import { verifyEptId } from '../../utils/googleSheets';
import { createSession, setSessionCookie, generateCsrfToken } from '../../utils/session';
import { withAuth } from '../../utils/withAuth';
import { authLimiter } from '../../utils/rateLimit';
import { validateEptId } from '../../utils/validation';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { eptId } = req.body || {};

  const validation = validateEptId(eptId);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.error });
  }

  const user = await verifyEptId(validation.value);
  if (!user) {
    return res.status(401).json({ message: 'Invalid EPT ID' });
  }

  // Create server-side session and set httpOnly cookie
  const token = createSession(user);
  setSessionCookie(res, token);

  return res.status(200).json({
    name: user.name,
    email: user.email,
    eptId: user.eptId,
    csrfToken: generateCsrfToken(token),
  });
}

export default withAuth(handler, { skipAuth: true, rateLimiter: authLimiter });
