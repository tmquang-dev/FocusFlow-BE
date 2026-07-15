import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { User, Workspace, Task, Otp } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const JWT_REGISTRATION_SECRET = process.env.JWT_REGISTRATION_SECRET || 'temp_registration_secret_key';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'main_access_secret_key';

/**
 * Gửi mã OTP đăng ký (Send OTP)
 * @param {string} email 
 */
export const sendOtp = async (email) => {
  // 1. Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'EMAIL_ALREADY_EXISTS', 'Email này đã được sử dụng để đăng ký.');
  }

  // 2. Sinh mã OTP 6 số
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

  // 3. Lưu hoặc cập nhật OTP vào DB (upsert)
  await Otp.findOneAndUpdate(
    { email },
    { code, expires_at: expiresAt },
    { upsert: true, new: true }
  );

  // 4. Gửi email qua Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: 'FocusFlow <onboarding@resend.dev>',
        to: email,
        subject: 'Mã xác thực đăng ký tài khoản FocusFlow',
        html: `<p>Mã OTP của bạn là: <strong>${code}</strong>. Mã này có thời hạn sử dụng là 5 phút.</p>`,
      });
    } catch (error) {
      throw new ApiError(500, 'EMAIL_SEND_FAILED', 'Không thể gửi email OTP. Vui lòng thử lại.');
    }
  } else {
    // Nếu chưa cấu hình Resend, in ra console phục vụ development & testing
    console.log(`[DEVELOPMENT ONLY] OTP cho ${email} là: ${code}`);
  }
};

/**
 * Xác thực mã OTP (Verify OTP)
 * @param {string} email 
 * @param {string} code 
 * @returns {Promise<string>} registrationToken
 */
export const verifyOtp = async (email, code) => {
  // 1. Tìm OTP trong DB
  const otpRecord = await Otp.findOne({ email, code });
  if (!otpRecord) {
    throw new ApiError(400, 'INVALID_OTP', 'Mã OTP không chính xác hoặc đã hết hạn.');
  }

  // 2. Xóa mã OTP để tránh tái sử dụng
  await Otp.deleteOne({ _id: otpRecord._id });

  // 3. Sinh registration_token (10 phút)
  const registrationToken = jwt.sign({ email }, JWT_REGISTRATION_SECRET, {
    expiresIn: '10m',
  });

  return registrationToken;
};

/**
 * Hoàn tất đăng ký (Complete Registration)
 * @param {string} registrationToken 
 * @param {string} password 
 * @returns {Promise<object>} { access_token, user }
 */
export const completeRegister = async (registrationToken, password) => {
  let email;

  // 1. Giải mã và verify registration_token
  try {
    const decoded = jwt.verify(registrationToken, JWT_REGISTRATION_SECRET);
    email = decoded.email;
  } catch (error) {
    throw new ApiError(401, 'INVALID_TOKEN', 'Mã token đăng ký không hợp lệ hoặc đã hết hạn.');
  }

  // 2. Kiểm tra lại xem User đã tồn tại chưa (phòng ngừa race condition)
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'EMAIL_ALREADY_EXISTS', 'Email này đã được sử dụng để đăng ký.');
  }

  // 3. Tự động lấy tiền tố trước dấu @ làm full_name mặc định
  const fullName = email.split('@')[0];

  // 4. Tạo tài khoản User mới (Pre-save hook trong user.model.js sẽ hash password)
  const user = await User.create({
    email,
    password_hash: password,
    full_name: fullName,
    auth_provider: 'local',
  });

  // 5. Khởi tạo dữ liệu onboarding (Workspace 1 và 3 tasks hướng dẫn)
  const workspace = await Workspace.create({
    name: 'Workspace 1',
    user_id: user._id,
  });

  const defaultTasks = [
    {
      workspace_id: workspace._id,
      user_id: user._id,
      title: 'Chào mừng bạn đến với FocusFlow! 🚀',
      description: 'Đây là không gian làm việc của bạn. Hãy thử bắt đầu một phiên Pomodoro cho nhiệm vụ này.',
      status: 'TO_DO',
      order: 0,
    },
    {
      workspace_id: workspace._id,
      user_id: user._id,
      title: 'Cách làm việc với Kanban Board 📋',
      description: 'Kéo thả các thẻ nhiệm vụ giữa các cột (Backlog, To Do, In Progress, Done) để cập nhật trạng thái công việc của bạn.',
      status: 'TO_DO',
      order: 1,
    },
    {
      workspace_id: workspace._id,
      user_id: user._id,
      title: 'Tập trung cùng Pomodoro Timer ⏱️',
      description: 'Click vào biểu tượng Pomodoro để kích hoạt phiên làm việc 25 phút. Hệ thống sẽ tự động ghi nhận tiến độ của bạn.',
      status: 'TO_DO',
      order: 2,
    },
  ];

  await Task.create(defaultTasks);

  // 6. Tạo access_token đăng nhập chính thức (1 ngày)
  const accessToken = jwt.sign({ id: user._id, email: user.email }, JWT_ACCESS_SECRET, {
    expiresIn: '1d',
  });

  // 7. Trả về dữ liệu chuẩn format
  return {
    access_token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
    },
  };
};
