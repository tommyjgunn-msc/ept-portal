// utils/rateLimit.js — In-memory rate limiting for Vercel serverless

// Store: Map<identifier, { count, resetTime }>
const stores = new Map();

function getStore(name) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name);
}

function cleanup(store) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * Rate limiter factory.
 * @param {Object} options
 * @param {string} options.name - Unique store name
 * @param {number} options.max - Max requests in the window
 * @param {number} options.windowMs - Time window in ms
 * @returns {Function} middleware: (req, res) => { allowed: boolean, remaining: number }
 */
export function createRateLimiter({ name, max, windowMs }) {
  return function checkRate(req) {
    const store = getStore(name);
    cleanup(store);

    // Use forwarded IP (Vercel sets x-forwarded-for) or fallback
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
      .split(',')[0]
      .trim();

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: max - 1 };
    }

    entry.count++;
    if (entry.count > max) {
      return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
    }

    return { allowed: true, remaining: max - entry.count };
  };
}

// Pre-configured limiters
export const authLimiter = createRateLimiter({
  name: 'auth',
  max: 10,
  windowMs: 15 * 60 * 1000, // 10 attempts per 15 minutes
});

export const apiLimiter = createRateLimiter({
  name: 'api',
  max: 100,
  windowMs: 60 * 1000, // 100 requests per minute
});
