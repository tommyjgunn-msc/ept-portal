// utils/session.js — Signed cookie sessions for Vercel serverless
// Uses HMAC-signed tokens instead of in-memory storage so sessions
// survive across different serverless function instances.
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours
const COOKIE_NAME = 'ept_session';
const isProduction = process.env.NODE_ENV === 'production';

// Secret for signing — falls back to a derived key from the Google credentials
function getSecret() {
  return process.env.SESSION_SECRET
    || process.env.GOOGLE_PRIVATE_KEY?.slice(0, 64)
    || 'ept-portal-default-secret-change-me';
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, sig] = parts;
  const expectedSig = createHmac('sha256', getSecret()).update(data).digest('base64url');

  // Timing-safe comparison
  try {
    const sigBuf = Buffer.from(sig, 'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    // Check expiry
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSession(user) {
  const payload = {
    user: {
      name: user.name,
      email: user.email,
      eptId: user.eptId,
    },
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL,
  };
  return sign(payload);
}

export function getSession(token) {
  const payload = verify(token);
  if (!payload) return null;
  return { user: payload.user, token };
}

export function destroySession() {
  // Nothing to destroy server-side — just clear the cookie
}

export function setSessionCookie(res, token) {
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL / 1000)}`,
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);
}

export function getSessionToken(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

// CSRF token generation
export function generateCsrfToken(sessionToken) {
  return createHmac('sha256', getSecret())
    .update(sessionToken + '_csrf')
    .digest('hex')
    .slice(0, 32);
}

export function validateCsrfToken(req, sessionToken) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const csrfHeader = req.headers['x-csrf-token'];
  if (!csrfHeader) return false;
  const expected = generateCsrfToken(sessionToken);
  return csrfHeader === expected;
}
