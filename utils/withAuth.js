// utils/withAuth.js — Authentication middleware for API routes
import { getSessionToken, getSession } from './session';
import { apiLimiter } from './rateLimit';

/**
 * Wraps an API handler to require a valid session.
 * Attaches req.user with { name, email, eptId } on success.
 *
 * @param {Function} handler - The API route handler (req, res)
 * @param {Object} options
 * @param {boolean} options.skipAuth - Skip auth check (for public routes like /api/auth)
 * @param {Function} options.rateLimiter - Custom rate limiter (defaults to apiLimiter)
 */
export function withAuth(handler, options = {}) {
  const { skipAuth = false, rateLimiter = apiLimiter } = options;

  return async function authMiddleware(req, res) {
    // Rate limiting
    const rateResult = rateLimiter(req);
    if (!rateResult.allowed) {
      return res.status(429).json({
        error: 'rate_limited',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateResult.retryAfter,
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Remaining', rateResult.remaining);

    // Auth check
    if (!skipAuth) {
      const token = getSessionToken(req);
      const session = getSession(token);

      if (!session) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Please log in to continue.',
        });
      }

      req.user = session.user;
      req.sessionToken = token;
    }

    // Run the actual handler
    try {
      return await handler(req, res);
    } catch (error) {
      // Structured error handling — no sensitive data in responses
      const isDev = process.env.NODE_ENV === 'development';
      console.error(`[API Error] ${req.url}:`, error.message);
      return res.status(500).json({
        error: 'internal_error',
        message: 'An unexpected error occurred.',
        ...(isDev && { detail: error.message }),
      });
    }
  };
}
