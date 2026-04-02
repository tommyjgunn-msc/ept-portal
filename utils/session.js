// utils/session.js — Server-side session management with httpOnly cookies
import { randomUUID, randomBytes, createHmac } from 'crypto';

// In-memory session store (resets on cold start — acceptable for Vercel scale)
const sessions = new Map();

// Clean up expired sessions periodically
const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes

let lastCleanup = Date.now();

function cleanupSessions() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) {
      sessions.delete(token);
    }
  }
}

export function createSession(user) {
  cleanupSessions();

  const token = randomUUID() + '-' + randomBytes(16).toString('hex');
  const session = {
    token,
    user: {
      name: user.name,
      email: user.email,
      eptId: user.eptId,
    },
    createdAt: Date.now(),
  };

  sessions.set(token, session);
  return token;
}

export function getSession(token) {
  if (!token || typeof token !== 'string') return null;
  cleanupSessions();

  const session = sessions.get(token);
  if (!session) return null;

  // Check expiry
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return null;
  }

  return session;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

// Cookie helpers
const COOKIE_NAME = 'ept_session';
const isProduction = process.env.NODE_ENV === 'production';

export function setSessionCookie(res, token) {
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL / 1000}`,
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

// CSRF token generation and validation
export function generateCsrfToken(sessionToken) {
  const secret = process.env.CSRF_SECRET || sessionToken;
  return createHmac('sha256', secret)
    .update(sessionToken + '_csrf')
    .digest('hex')
    .slice(0, 32);
}

export function validateCsrfToken(req, sessionToken) {
  // Skip CSRF for GET/HEAD/OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;

  const csrfHeader = req.headers['x-csrf-token'];
  if (!csrfHeader) return false;

  const expected = generateCsrfToken(sessionToken);
  return csrfHeader === expected;
}
