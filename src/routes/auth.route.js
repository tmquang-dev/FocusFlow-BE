import express from 'express';
import validate from '../middlewares/validate.middleware.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  completeRegisterSchema,
} from '../validations/auth.validation.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/register/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/register/complete', validate(completeRegisterSchema), authController.completeRegister);

export default router;
