const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const routes = require('./routes');
// const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middlewares bảo mật & phân tích cú pháp
app.use(helmet());
app.use(cors());
app.use(express.json());

// Gắn toàn bộ Routes API bắt đầu bằng /api/v1
// app.use('/api/v1', routes);

// Middleware xử lý lỗi tập trung (Luôn đặt ở cuối cùng)
// app.use(errorMiddleware);

module.exports = app;
