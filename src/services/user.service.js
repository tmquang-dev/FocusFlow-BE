import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { formatUser } from './auth.service.js';

/**
 * Get User Profile by ID
 * @param {string} userId
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password_hash');
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  }

  return formatUser(user);
};
