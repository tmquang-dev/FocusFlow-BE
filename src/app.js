import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import errorMiddleware from './middlewares/error.middleware.js';

import path from 'path';

const app = express();

// Middlewares bảo mật & phân tích cú pháp
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Phục vụ tệp tĩnh tải lên (như avatar)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Gắn toàn bộ Routes API bắt đầu bằng /api/v1
app.use('/api/v1', routes);

// Middleware xử lý lỗi tập trung (Luôn đặt ở cuối cùng)
app.use(errorMiddleware);

export default app;
