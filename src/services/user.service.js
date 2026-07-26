import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get User Profile by ID
 * @param {string} userId
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password_hash');
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  }

  return {
    id: user._id,
    email: user.email,
    full_name: user.full_name,
    avatar: user.avatar,
    is_verified: user.is_verified,
    auth_provider: user.auth_provider,
    created_at: user.created_at,
  };
};
