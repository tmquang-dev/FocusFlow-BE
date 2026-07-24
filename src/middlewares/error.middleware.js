import ApiError from '../utils/ApiError.js';

const errorMiddleware = (err, req, res, _next) => {
  let error = err;

  // Handle MongoDB duplicate key errors (code 11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    const message =
      field === 'email'
        ? 'This email address is already registered.'
        : `${field} already exists in the system.`;
    const code =
      field === 'email' ? 'EMAIL_ALREADY_EXISTS' : 'DUPLICATE_KEY_ERROR';
    error = new ApiError(400, code, message);
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const combinedMessage = error.issues
      ? error.issues.map((issue) => issue.message).join('. ')
      : 'Invalid input data.';
    error = new ApiError(400, 'VALIDATION_ERROR', combinedMessage);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'INVALID_TOKEN', 'Invalid token.');
  }
  if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'TOKEN_EXPIRED', 'Token has expired.');
  }

  // Normalize other unexpected errors to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error.';
    error = new ApiError(
      statusCode,
      'INTERNAL_SERVER_ERROR',
      message,
      false,
      err.stack
    );
  }

  const { statusCode, errorCode, message } = error;

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
