import express from 'express';
import validate from '../middlewares/validate.middleware.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  completeRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyPasswordOtpSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js';
import * as authController from '../controllers/auth.controller.js';
import { otpRateLimiter } from '../middlewares/rate-limit.middleware.js';

const router = express.Router();

router.post('/register/send-otp', validate(sendOtpSchema), otpRateLimiter, authController.sendOtp);
router.post('/register/resend-otp', validate(sendOtpSchema), otpRateLimiter, authController.sendOtp);
router.post('/register/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/register/complete', validate(completeRegisterSchema), authController.completeRegister);

router.post('/login', validate(loginSchema), authController.login);
router.post('/password/forgot', validate(forgotPasswordSchema), otpRateLimiter, authController.forgotPassword);
router.post('/password/resend-otp', validate(forgotPasswordSchema), otpRateLimiter, authController.forgotPassword);
router.post('/password/verify-otp', validate(verifyPasswordOtpSchema), authController.verifyPasswordOtp);
router.post('/password/reset', validate(resetPasswordSchema), authController.resetPassword);

export default router;
