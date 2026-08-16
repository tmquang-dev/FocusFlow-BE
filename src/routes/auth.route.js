import express from 'express';
import validate from '../middlewares/validate.middleware.js';
import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeRegisterSchema,
  loginSchema,
  googleAuthSchema,
  githubAuthSchema,
  forgotPasswordSchema,
  verifyPasswordOtpSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js';
import * as authController from '../controllers/auth.controller.js';
import {
  otpRateLimiter,
  verifyOtpRateLimiter,
} from '../middlewares/rate-limit.middleware.js';

const router = express.Router();

router.post(
  '/register/send-otp',
  validate(sendOtpSchema),
  otpRateLimiter,
  authController.sendOtp
);
router.post(
  '/register/resend-otp',
  validate(resendOtpSchema),
  otpRateLimiter,
  authController.resendRegisterOtp
);
router.post(
  '/register/verify-otp',
  validate(verifyOtpSchema),
  verifyOtpRateLimiter,
  authController.verifyOtp
);
router.post(
  '/register/complete',
  validate(completeRegisterSchema),
  authController.completeRegister
);

router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleAuthSchema), authController.googleAuth);
router.post('/github', validate(githubAuthSchema), authController.githubAuth);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

router.post(
  '/password/forgot',
  validate(forgotPasswordSchema),
  otpRateLimiter,
  authController.forgotPassword
);
router.post(
  '/password/resend-otp',
  validate(resendOtpSchema),
  otpRateLimiter,
  authController.resendPasswordOtp
);
router.post(
  '/password/verify-otp',
  validate(verifyPasswordOtpSchema),
  verifyOtpRateLimiter,
  authController.verifyPasswordOtp
);
router.post(
  '/password/reset',
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
