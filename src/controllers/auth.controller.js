import * as authService from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

/**
 * Send registration OTP code
 */
export const sendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.sendOtp(email);

  res.status(200).json({
    status: 'success',
    message: 'OTP code has been sent successfully via email.',
  });
});

/**
 * Resend registration OTP code
 */
export const resendRegisterOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.sendOtp(email);

  res.status(200).json({
    status: 'success',
    message: 'Registration OTP code has been resent successfully via email.',
  });
});

/**
 * Verify OTP code
 */
export const verifyOtp = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const registrationToken = await authService.verifyOtp(email, code);

  res.status(200).json({
    status: 'success',
    data: {
      registration_token: registrationToken,
    },
  });
});

/**
 * Complete account registration (Set password)
 */
export const completeRegister = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Registration token is missing or invalid.'
    );
  }
  const registrationToken = authHeader.split(' ')[1];

  const { password } = req.body;
  const result = await authService.completeRegister(
    registrationToken,
    password
  );

  res.status(211).json({
    status: 'success',
    data: result,
  });
});

/**
 * User Login
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Send password reset OTP
 */
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  res.status(200).json({
    status: 'success',
    message: 'Password reset OTP code has been sent.',
  });
});

/**
 * Resend password reset OTP
 */
export const resendPasswordOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  res.status(200).json({
    status: 'success',
    message: 'Password reset OTP code has been resent successfully.',
  });
});

/**
 * Verify password reset OTP
 */
export const verifyPasswordOtp = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const resetToken = await authService.verifyPasswordOtp(email, code);

  res.status(200).json({
    status: 'success',
    data: {
      reset_token: resetToken,
    },
  });
});

/**
 * Reset new password
 */
export const resetPassword = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Reset token is missing or invalid.'
    );
  }
  const resetToken = authHeader.split(' ')[1];

  const { password } = req.body;
  await authService.resetPassword(resetToken, password);

  res.status(200).json({
    status: 'success',
    message:
      'Your password has been updated successfully. Please log in again.',
  });
});
