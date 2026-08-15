import * as profileService from '../services/profile.service.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Lấy thông tin hồ sơ người dùng (API 3.6.1)
 * GET /api/v1/profile
 */
export const getProfile = catchAsync(async (req, res) => {
  const user = await profileService.getProfile(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

/**
 * Cập nhật thông tin hồ sơ (API 3.6.2)
 * PUT /api/v1/profile
 */
export const updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await profileService.updateProfile(
    req.user._id,
    req.body
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Tải ảnh đại diện mới lên (API 3.6.3)
 * POST /api/v1/profile/avatar
 */
export const uploadAvatar = catchAsync(async (req, res) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  const baseUrl = `${protocol}://${host}`;

  const result = await profileService.uploadAvatar(
    req.user._id,
    req.file,
    baseUrl
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Hủy liên kết mạng xã hội (API 3.6.4)
 * POST /api/v1/profile/oauth/unlink
 */
export const unlinkOAuth = catchAsync(async (req, res) => {
  const result = await profileService.unlinkOAuth(
    req.user._id,
    req.body.provider
  );

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Thực hiện liên kết tài khoản mạng xã hội mới (API 3.6.5)
 * POST /api/v1/profile/oauth/link
 */
export const linkOAuth = catchAsync(async (req, res) => {
  const result = await profileService.linkOAuth(
    req.user._id,
    req.body.provider,
    req.body.auth_code
  );

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});
