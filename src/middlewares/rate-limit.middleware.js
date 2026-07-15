import ApiError from '../utils/ApiError.js';
import { Otp } from '../models/index.js';

// In-memory store for IP rate limiting (Key: IP, Value: { count, resetTime })
const ipLimits = new Map();

/**
 * Middleware ngăn ngừa spam gửi OTP bằng email và IP
 */
export const otpRateLimiter = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { email } = req.body;
  const now = Date.now();

  // 1. Giới hạn 5 yêu cầu/giờ trên mỗi địa chỉ IP (chống botnet)
  let ipRecord = ipLimits.get(ip);
  if (ipRecord) {
    if (now > ipRecord.resetTime) {
      // Reset khi vượt quá 1 giờ
      ipLimits.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    } else {
      if (ipRecord.count >= 5) {
        return next(
          new ApiError(
            429,
            'IP_RATE_LIMIT_EXCEEDED',
            'Bạn đã yêu cầu gửi OTP quá giới hạn cho phép từ IP này. Vui lòng thử lại sau 1 giờ.'
          )
        );
      }
      ipRecord.count += 1;
    }
  } else {
    ipLimits.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
  }

  // 2. Giới hạn 1 yêu cầu/phút đối với cùng một địa chỉ email
  if (email) {
    try {
      const existingOtp = await Otp.findOne({ email });
      if (existingOtp) {
        const createdAt = new Date(existingOtp.created_at).getTime();
        const timeElapsed = now - createdAt;

        if (timeElapsed < 60 * 1000) {
          // Còn lại số giây cần chờ
          const secondsRemaining = Math.ceil((60 * 1000 - timeElapsed) / 1000);
          return next(
            new ApiError(
              429,
              'TOO_MANY_REQUESTS',
              `Vui lòng đợi ${secondsRemaining} giây trước khi yêu cầu gửi lại mã OTP mới.`
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
