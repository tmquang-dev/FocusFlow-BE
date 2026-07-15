import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User, Workspace, Task, Otp } from '../src/models/index.js';

const JWT_REGISTRATION_SECRET = process.env.JWT_REGISTRATION_SECRET || 'temp_registration_secret_key';

describe('LUỒNG ĐĂNG KÝ TÀI KHOẢN (REGISTER FLOW)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // ==========================================
  // API 3.1.1: Gửi OTP (send-otp)
  // ==========================================
  describe('API 3.1.1: Gửi yêu cầu Đăng ký (Gửi OTP)', () => {
    it('Happy Path: Gửi OTP thành công cho email hợp lệ và chưa đăng ký', async () => {
      // Giả lập không tìm thấy User tồn tại
      const findUserSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);
      // Giả lập lưu OTP vào database thành công
      const findOtpSpy = jest.spyOn(Otp, 'findOneAndUpdate').mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/register/send-otp')
        .send({ email: 'developer.lam@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Mã OTP đã được gửi thành công qua email.',
      });
      expect(findUserSpy).toHaveBeenCalledWith({ email: 'developer.lam@gmail.com' });
      expect(findOtpSpy).toHaveBeenCalled();
    });

    it('Input Validation: Báo lỗi khi email rỗng hoặc sai định dạng', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/send-otp')
        .send({ email: 'invalid-email-format' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('Định dạng email không hợp lệ');
    });

    it('Business Logic: Báo lỗi EMAIL_ALREADY_EXISTS nếu email đã được sử dụng', async () => {
      // Giả lập tìm thấy User đã tồn tại
      jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'developer.lam@gmail.com' });

      const res = await request(app)
        .post('/api/v1/auth/register/send-otp')
        .send({ email: 'developer.lam@gmail.com' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email này đã được sử dụng để đăng ký.',
      });
    });
  });

  // ==========================================
  // API 3.1.2: Xác thực OTP (verify-otp)
  // ==========================================
  describe('API 3.1.2: Xác thực mã OTP Đăng ký', () => {
    it('Happy Path: Xác thực mã OTP thành công, xóa OTP và trả về registration_token', async () => {
      // Giả lập tìm thấy OTP khớp trong database
      const mockOtpRecord = { _id: 'mock_otp_id', email: 'developer.lam@gmail.com', code: '123456' };
      const findOtpSpy = jest.spyOn(Otp, 'findOne').mockResolvedValue(mockOtpRecord);
      const deleteOtpSpy = jest.spyOn(Otp, 'deleteOne').mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/register/verify-otp')
        .send({ email: 'developer.lam@gmail.com', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.registration_token).toBeDefined();

      // Kiểm tra token xem có mã hóa đúng email không
      const decoded = jwt.verify(res.body.data.registration_token, JWT_REGISTRATION_SECRET);
      expect(decoded.email).toBe('developer.lam@gmail.com');

      expect(findOtpSpy).toHaveBeenCalledWith({ email: 'developer.lam@gmail.com', code: '123456' });
      expect(deleteOtpSpy).toHaveBeenCalledWith({ _id: 'mock_otp_id' });
    });

    it('Input Validation: Báo lỗi khi mã OTP không đủ 6 số hoặc có chữ cái', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/verify-otp')
        .send({ email: 'developer.lam@gmail.com', code: '123a5' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('Business Logic: Báo lỗi INVALID_OTP khi OTP sai hoặc hết hạn', async () => {
      // Giả lập không tìm thấy OTP khớp trong database
      jest.spyOn(Otp, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/register/verify-otp')
        .send({ email: 'developer.lam@gmail.com', code: '999999' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        code: 'INVALID_OTP',
        message: 'Mã OTP không chính xác hoặc đã hết hạn.',
      });
    });
  });

  // ==========================================
  // API 3.1.3: Đặt mật khẩu & Hoàn tất (complete)
  // ==========================================
  describe('API 3.1.3: Đặt mật khẩu & Hoàn tất Đăng ký', () => {
    let validRegToken;

    beforeEach(() => {
      validRegToken = jwt.sign({ email: 'developer.lam@gmail.com' }, JWT_REGISTRATION_SECRET, {
        expiresIn: '10m',
      });
    });

    it('Happy Path: Hoàn tất đăng ký thành công, kích hoạt onboarding (Workspace & Task mẫu), trả về 211 Created', async () => {
      const mockUser = {
        _id: '65c2b3f12a83f819001aaaaa',
        email: 'developer.lam@gmail.com',
        full_name: 'developer.lam',
      };

      // Spies các Mongoose Model để cô lập DB
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue(mockUser);
      jest.spyOn(Workspace, 'create').mockResolvedValue({ _id: 'mock_workspace_id', name: 'Workspace 1' });
      const createTasksSpy = jest.spyOn(Task, 'create').mockResolvedValue([]);

      const res = await request(app)
        .post('/api/v1/auth/register/complete')
        .set('Authorization', `Bearer ${validRegToken}`)
        .send({ password: 'SecurePassword123!', confirm_password: 'SecurePassword123!' });

      expect(res.status).toBe(211); // 211 Created theo spec
      expect(res.body.status).toBe('success');
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        full_name: mockUser.full_name,
      });

      // Kiểm tra onboarding: Đã tạo 3 tasks hướng dẫn
      expect(createTasksSpy).toHaveBeenCalled();
      expect(createTasksSpy.mock.calls[0][0]).toHaveLength(3);
    });

    it('Input Validation: Báo lỗi khi password và confirm_password không trùng khớp', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/complete')
        .set('Authorization', `Bearer ${validRegToken}`)
        .send({ password: 'SecurePassword123!', confirm_password: 'DifferentPassword123' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('Mật khẩu xác nhận không trùng khớp');
    });

    it('Business Logic: Báo lỗi UNAUTHORIZED khi thiếu hoặc sai token đăng ký', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/complete')
        .set('Authorization', `Bearer invalid_token_xyz`)
        .send({ password: 'SecurePassword123!', confirm_password: 'SecurePassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('INVALID_TOKEN');
    });
  });
});
