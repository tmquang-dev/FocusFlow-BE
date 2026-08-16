import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { uploadAvatarMiddleware } from '../middlewares/upload.middleware.js';
import * as profileController from '../controllers/profile.controller.js';
import {
  updateProfileSchema,
  unlinkOAuthSchema,
  linkOAuthSchema,
} from '../validations/profile.validation.js';

const router = express.Router();

// Tất cả các route quản lý profile & OAuth đều yêu cầu người dùng phải xác thực (Bearer token / Cookie)
router.use(authMiddleware);

// API 3.6.1: Lấy thông tin hồ sơ người dùng
router.get('/', profileController.getProfile);

// API 3.6.2: Lưu thông tin thay đổi hồ sơ
router.put('/', validate(updateProfileSchema), profileController.updateProfile);

// API 3.6.3: Tải ảnh đại diện mới lên (multipart/form-data với field 'file' hoặc 'avatar')
router.post(
  '/avatar',
  uploadAvatarMiddleware.single('file'),
  profileController.uploadAvatar
);

// API 3.6.4: Hủy liên kết mạng xã hội
router.post(
  '/oauth/unlink',
  validate(unlinkOAuthSchema),
  profileController.unlinkOAuth
);

// API 3.6.5: Thực hiện liên kết tài khoản mạng xã hội mới
router.post(
  '/oauth/link',
  validate(linkOAuthSchema),
  profileController.linkOAuth
);

export default router;
