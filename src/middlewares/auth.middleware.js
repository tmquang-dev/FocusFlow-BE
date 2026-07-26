import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/index.js';

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'main_access_secret_key';

/**
 * Authentication Middleware
 * Reads access_token from HttpOnly cookie or Authorization Bearer header
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new ApiError(
        401,
        'UNAUTHORIZED',
        'Authentication required. Please log in.'
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch {
      throw new ApiError(
        401,
        'INVALID_ACCESS_TOKEN',
        'Access token is invalid or expired.'
      );
    }

    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) {
      throw new ApiError(401, 'USER_NOT_FOUND', 'User account not found.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
