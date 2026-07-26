/* eslint-disable n/no-unpublished-import */
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User, Workspace, Task, Otp } from '../src/models/index.js';

const JWT_REGISTRATION_SECRET =
  process.env.JWT_REGISTRATION_SECRET || 'temp_registration_secret_key';
const JWT_RESET_SECRET =
  process.env.JWT_RESET_SECRET || 'temp_reset_secret_key';

describe('INTEGRATION TESTS: AUTH FLOWS', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    // Default mocks to prevent database connection buffering timeouts
    jest.spyOn(Otp, 'findOne').mockResolvedValue(null);
    jest.spyOn(Otp, 'findOneAndUpdate').mockResolvedValue({});
    jest.spyOn(Otp, 'deleteOne').mockResolvedValue({});
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({});
    jest.spyOn(Workspace, 'create').mockResolvedValue({});
    jest.spyOn(Task, 'create').mockResolvedValue([]);
  });

  // ==========================================
  // REGISTER FLOW
  // ==========================================
  describe('Đăng ký tài khoản (Register Flow)', () => {
    it('Register OTP: Gửi OTP thành công cho email hợp lệ', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/send-otp')
        .send({ email: 'developer.lam@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'OTP code has been sent successfully via email.',
      });
    });

    it('Resend Register OTP: Gửi lại mã OTP đăng ký thành công', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/resend-otp')
        .send({ email: 'developer.lam@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe(
        'Registration OTP code has been resent successfully via email.'
      );
    });

    it('Verify Register OTP: Xác thực mã OTP đăng ký thành công và nhận registration_token', async () => {
      const mockOtp = {
        _id: 'otp_id',
        email: 'developer.lam@gmail.com',
        code: '123456',
      };
      jest.spyOn(Otp, 'findOne').mockResolvedValue(mockOtp);

      const res = await request(app)
        .post('/api/v1/auth/register/verify-otp')
        .send({ email: 'developer.lam@gmail.com', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.registration_token).toBeDefined();
    });

    it('Complete Register: Đặt mật khẩu và hoàn tất đăng ký thành công, kích hoạt onboarding (211 Created)', async () => {
      const regToken = jwt.sign(
        { email: 'developer.lam@gmail.com' },
        JWT_REGISTRATION_SECRET,
        { expiresIn: '10m' }
      );
      const mockUser = {
        _id: 'user_id',
        email: 'developer.lam@gmail.com',
        full_name: 'developer.lam',
      };

      jest.spyOn(User, 'create').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/register/complete')
        .set('Authorization', `Bearer ${regToken}`)
        .send({
          password: 'SecurePassword123!',
          confirm_password: 'SecurePassword123!',
        });

      expect(res.status).toBe(211);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  // ==========================================
  // FORGOT / RESET PASSWORD FLOW
  // ==========================================
  describe('Khôi phục mật khẩu (Forgot/Reset Password Flow)', () => {
    it('Forgot Pass: Yêu cầu khôi phục mật khẩu gửi OTP thành công', async () => {
      jest
        .spyOn(User, 'findOne')
        .mockResolvedValue({ email: 'developer.lam@gmail.com' });

      const res = await request(app)
        .post('/api/v1/auth/password/forgot')
        .send({ email: 'developer.lam@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Password reset OTP code has been sent.',
      });
    });

    it('Forgot Pass Resend OTP: Gửi lại mã OTP khôi phục thành công', async () => {
      jest
        .spyOn(User, 'findOne')
        .mockResolvedValue({ email: 'developer.lam@gmail.com' });

      const res = await request(app)
        .post('/api/v1/auth/password/resend-otp')
        .send({ email: 'developer.lam@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe(
        'Password reset OTP code has been resent successfully.'
      );
    });

    it('Forgot Pass verify: Xác thực OTP khôi phục thành công và nhận reset_token', async () => {
      const mockOtp = {
        _id: 'otp_id',
        email: 'developer.lam@gmail.com',
        code: '654321',
      };
      jest.spyOn(Otp, 'findOne').mockResolvedValue(mockOtp);

      const res = await request(app)
        .post('/api/v1/auth/password/verify-otp')
        .send({ email: 'developer.lam@gmail.com', code: '654321' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reset_token).toBeDefined();
    });

    it('Forgot Pass reset: Đặt lại mật khẩu thành công bằng reset_token', async () => {
      const resetToken = jwt.sign(
        { email: 'developer.lam@gmail.com' },
        JWT_RESET_SECRET,
        { expiresIn: '10m' }
      );
      const mockUser = {
        email: 'developer.lam@gmail.com',
        save: jest.fn().mockResolvedValue({}),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/password/reset')
        .set('Authorization', `Bearer ${resetToken}`)
        .send({
          password: 'NewSecurePassword123!',
          confirm_password: 'NewSecurePassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message:
          'Your password has been updated successfully. Please log in again.',
      });
      expect(mockUser.password_hash).toBe('NewSecurePassword123!');
    });
  });

  // ==========================================
  // LOGIN FLOW
  // ==========================================
  describe('Đăng nhập (Login Flow)', () => {
    it('Login: Đăng nhập thành công với thông tin chính xác', async () => {
      const mockUser = {
        _id: '65c2b3f12a83f819001aaaaa',
        email: 'developer.lam@gmail.com',
        full_name: 'Lâm Nguyễn',
        auth_provider: 'local',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'developer.lam@gmail.com',
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.data.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        avatar: null,
        is_verified: false,
        auth_provider: 'local',
        created_at: undefined,
      });
    });

    it('Login: Từ chối đăng nhập nếu tài khoản là Google/Github OAuth', async () => {
      const mockUser = {
        _id: 'oauth_user_id',
        email: 'developer.lam@gmail.com',
        auth_provider: 'google',
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'developer.lam@gmail.com',
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('SOCIAL_LOGIN_REQUIRED');
    });

    it('Login: Từ chối đăng nhập khi sai email hoặc mật khẩu', async () => {
      const mockUser = {
        email: 'developer.lam@gmail.com',
        auth_provider: 'local',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'developer.lam@gmail.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  // ==========================================
  // OTP SPAM PREVENTION (RATE LIMITING)
  // ==========================================
  describe('Phòng ngừa Spam Email OTP (Rate Limiting)', () => {
    it('Email Limit: Chặn yêu cầu gửi OTP lần 2 trong vòng 60 giây đối với cùng email', async () => {
      const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
      const mockOtp = {
        email: 'developer.lam@gmail.com',
        created_at: tenSecondsAgo,
      };

      jest.spyOn(Otp, 'findOne').mockResolvedValue(mockOtp);

      const res = await request(app)
        .post('/api/v1/auth/register/send-otp')
        .send({ email: 'developer.lam@gmail.com' });

      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('TOO_MANY_REQUESTS');
      expect(res.body.message).toContain('Please wait');
    });

    it('IP Limit: Chặn yêu cầu gửi OTP nếu vượt quá 5 lần/giờ từ cùng một địa chỉ IP', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/register/send-otp')
          .set('X-Forwarded-For', '192.168.1.100')
          .send({ email: `user${i}@gmail.com` });
      }

      const res = await request(app)
        .post('/api/v1/auth/register/send-otp')
        .set('X-Forwarded-For', '192.168.1.100')
        .send({ email: 'user6@gmail.com' });

      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('IP_RATE_LIMIT_EXCEEDED');
      expect(res.body.message).toContain(
        'You have exceeded the OTP request limit'
      );
    });
  });
});
