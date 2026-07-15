import ApiError from '../utils/ApiError.js';

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Handle MongoDB duplicate key errors (code 11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    const message =
      field === 'email'
        ? 'Email này đã được sử dụng để đăng ký.'
        : `${field} đã tồn tại trong hệ thống.`;
    const code = field === 'email' ? 'EMAIL_ALREADY_EXISTS' : 'DUPLICATE_KEY_ERROR';
    error = new ApiError(400, code, message);
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    // Extract first error message or join them
    const combinedMessage = error.issues
      ? error.issues.map((issue) => issue.message).join('. ')
      : 'Dữ liệu đầu vào không hợp lệ.';
    error = new ApiError(400, 'VALIDATION_ERROR', combinedMessage);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'INVALID_TOKEN', 'Mã token không hợp lệ.');
  }
  if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'TOKEN_EXPIRED', 'Mã token đã hết hạn.');
  }

  // Normalize other unexpected errors to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi hệ thống nội bộ.';
    // In production, you might want to hide internal stack trace
    error = new ApiError(statusCode, 'INTERNAL_SERVER_ERROR', message, false, err.stack);
  }

  const { statusCode, errorCode, message } = error;

  // Log error stack if it's internal server error
  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message: message,
  });
};

export default errorMiddleware;
