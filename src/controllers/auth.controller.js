import * as authService from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

/**
 * Gửi mã OTP đăng ký
 */
export const sendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.sendOtp(email);

  res.status(200).json({
    status: 'success',
    message: 'Mã OTP đã được gửi thành công qua email.',
  });
});

/**
 * Gửi lại mã OTP đăng ký (Resend Register OTP)
 */
export const resendRegisterOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.sendOtp(email);

  res.status(200).json({
    status: 'success',
    message: 'Mã OTP đăng ký đã được gửi lại thành công qua email.',
  });
});


/**
 * Xác thực mã OTP
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
 * Hoàn tất đăng ký tài khoản (Đặt mật khẩu)
 */
export const completeRegister = catchAsync(async (req, res) => {
  // Trích xuất registration_token từ Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Mã token đăng ký bị thiếu hoặc không đúng định dạng.'
    );
  }
  const registrationToken = authHeader.split(' ')[1];

  const { password } = req.body;
  const result = await authService.completeRegister(
    registrationToken,
    password
  );

  // Phản hồi thành công với mã 211 Created theo đặc tả yêu cầu
  res.status(211).json({
    status: 'success',
    data: result,
  });
});

/**
 * Đăng nhập
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
 * Gửi mã OTP khôi phục mật khẩu
 */
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  res.status(200).json({
    status: 'success',
    message: 'Mã OTP đặt lại mật khẩu đã được gửi.',
  });
});

/**
 * Gửi lại mã OTP khôi phục mật khẩu (Resend Password OTP)
 */
export const resendPasswordOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  res.status(200).json({
    status: 'success',
    message: 'Mã OTP khôi phục mật khẩu đã được gửi lại thành công.',
  });
});


/**
 * Xác thực OTP khôi phục mật khẩu
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
 * Đặt lại mật khẩu mới
 */
export const resetPassword = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Mã token khôi phục bị thiếu hoặc không đúng định dạng.'
    );
  }
  const resetToken = authHeader.split(' ')[1];

  const { password } = req.body;
  await authService.resetPassword(resetToken, password);

  res.status(200).json({
    status: 'success',
    message:
      'Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại.',
  });
});
