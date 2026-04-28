import { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config/env';

const config = getConfig();

interface RateLimitData {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter (for demo purposes)
// In production, this would be Redis-based with sliding window
const rateLimitStore = new Map<string, RateLimitData>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  let record = rateLimitStore.get(clientId);

  if (!record || now > record.resetTime) {
    // Create new record
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(clientId, record);
    next();
    return;
  }

  if (record.count >= maxRequests) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count += 1;
  rateLimitStore.set(clientId, record);
  next();
};

// Clean up expired records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Run every minute
