import * as userService from '../services/user.service.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get current authenticated user profile (/v1/users/me)
 */
export const getMe = catchAsync(async (req, res) => {
  const userProfile = await userService.getUserProfile(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      user: userProfile,
    },
  });
});
