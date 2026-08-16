import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jpg',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'INVALID_FILE_TYPE',
        'Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên tệp ảnh (JPEG, PNG, WEBP, GIF).'
      ),
      false
    );
  }
};

export const uploadAvatarMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
  fileFilter,
});
