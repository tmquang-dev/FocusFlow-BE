import ApiError from '../utils/ApiError.js';
import { Otp } from '../models/index.js';

// In-memory store for IP rate limiting (Key: IP, Value: { count, resetTime })
const ipLimits = new Map();

/**
 * Middleware to prevent email & IP OTP spamming
 */
export const otpRateLimiter = async (req, res, next) => {
  const ip =
    req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { email } = req.body;
  const now = Date.now();

  // 1. Limit 5 requests/hour per IP address
  let ipRecord = ipLimits.get(ip);
  if (ipRecord) {
    if (now > ipRecord.resetTime) {
      ipLimits.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    } else {
      if (ipRecord.count >= 5) {
        return next(
          new ApiError(
            429,
            'IP_RATE_LIMIT_EXCEEDED',
            'You have exceeded the OTP request limit from this IP address. Please try again after 1 hour.'
          )
        );
      }
      ipRecord.count += 1;
    }
  } else {
    ipLimits.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
  }

  // 2. Limit 1 request/minute for the same email address
  if (email) {
    try {
      const existingOtp = await Otp.findOne({ email });
      if (existingOtp) {
        const createdAt = new Date(existingOtp.created_at).getTime();
        const timeElapsed = now - createdAt;

        if (timeElapsed < 60 * 1000) {
          const secondsRemaining = Math.ceil((60 * 1000 - timeElapsed) / 1000);
          return next(
            new ApiError(
              429,
              'TOO_MANY_REQUESTS',
              `Please wait ${secondsRemaining} seconds before requesting a new OTP code.`
            )
          );
        }
      }
    } catch (error) {
      return next(error);
    }
  }

  next();
};

const verifyLimits = new Map();

/**
 * Middleware to prevent brute-forcing OTP verification
 */
export const verifyOtpRateLimiter = (req, res, next) => {
  const ip =
    req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  let record = verifyLimits.get(ip);
  if (record) {
    if (now > record.resetTime) {
      verifyLimits.set(ip, { count: 1, resetTime: now + 60 * 1000 });
    } else {
      if (record.count >= 10) {
        return next(
          new ApiError(
            429,
            'TOO_MANY_VERIFICATION_ATTEMPTS',
            'Too many OTP verification attempts. Please wait 1 minute before trying again.'
          )
        );
      }
      record.count += 1;
    }
  } else {
    verifyLimits.set(ip, { count: 1, resetTime: now + 60 * 1000 });
  }

  next();
};
