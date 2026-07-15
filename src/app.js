import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

// Middlewares bảo mật & phân tích cú pháp
app.use(helmet());
app.use(cors());
app.use(express.json());

// Gắn toàn bộ Routes API bắt đầu bằng /api/v1
app.use('/api/v1', routes);

// Middleware xử lý lỗi tập trung (Luôn đặt ở cuối cùng)
app.use(errorMiddleware);

export default app;
