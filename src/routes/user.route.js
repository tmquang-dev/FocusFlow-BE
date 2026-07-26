import express from 'express';
import * as userController from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/v1/users/me - Get current user profile
router.get('/me', authMiddleware, userController.getMe);

export default router;
