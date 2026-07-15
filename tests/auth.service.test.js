import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import * as authService from '../src/services/auth.service.js';
import { User, Workspace, Task, Otp } from '../src/models/index.js';
import ApiError from '../src/utils/ApiError.js';

const JWT_REGISTRATION_SECRET = process.env.JWT_REGISTRATION_SECRET || 'temp_registration_secret_key';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'temp_reset_secret_key';

describe('UNIT TESTS: AUTH SERVICE LOGIC', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // ==========================================
  // sendOtp()
  // ==========================================
  describe('sendOtp(email)', () => {
    it('nên tạo OTP và gửi email thành công nếu email chưa đăng ký', async () => {
      const email = 'new.user@gmail.com';
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(Otp, 'findOneAndUpdate').mockResolvedValue({});

      await authService.sendOtp(email);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(Otp.findOneAndUpdate).toHaveBeenCalled();
    });

    it('nên ném lỗi ApiError EMAIL_ALREADY_EXISTS nếu email đã đăng ký', async () => {
      const email = 'existing.user@gmail.com';
      jest.spyOn(User, 'findOne').mockResolvedValue({ email });

      await expect(authService.sendOtp(email)).rejects.toThrow(ApiError);
    });
  });

  // ==========================================
  // verifyOtp()
  // ==========================================
  describe('verifyOtp(email, code)', () => {
    it('nên xóa OTP và trả về registration_token nếu khớp', async () => {
      const email = 'user@gmail.com';
      const code = '123456';
      jest.spyOn(Otp, 'findOne').mockResolvedValue({ _id: 'otp_id', email, code });
      jest.spyOn(Otp, 'deleteOne').mockResolvedValue({});

      const token = await authService.verifyOtp(email, code);

      expect(token).toBeDefined();
      expect(Otp.deleteOne).toHaveBeenCalledWith({ _id: 'otp_id' });
    });

    it('nên ném lỗi ApiError INVALID_OTP nếu mã OTP không chính xác', async () => {
      jest.spyOn(Otp, 'findOne').mockResolvedValue(null);

      await expect(authService.verifyOtp('user@gmail.com', '000000')).rejects.toThrow(ApiError);
    });
  });

  // ==========================================
  // completeRegister()
  // ==========================================
  describe('completeRegister(registrationToken, password)', () => {
    let registrationToken;
    const email = 'developer.lam@gmail.com';

    beforeEach(() => {
      registrationToken = jwt.sign({ email }, JWT_REGISTRATION_SECRET, { expiresIn: '10m' });
    });

    it('nên tạo User, Workspace và các Task onboarding thành công', async () => {
      const password = 'SecurePassword123!';
      const mockUser = { _id: 'user_id', email, full_name: 'developer.lam' };

      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue(mockUser);
      jest.spyOn(Workspace, 'create').mockResolvedValue({ _id: 'ws_id', name: 'Workspace 1' });
      jest.spyOn(Task, 'create').mockResolvedValue([]);

      const result = await authService.completeRegister(registrationToken, password);

      expect(result.access_token).toBeDefined();
      expect(result.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        full_name: mockUser.full_name,
      });
    });
  });

  // ==========================================
  // login()
  // ==========================================
  describe('login(email, password)', () => {
    it('nên đăng nhập thành công và sinh access_token', async () => {
      const email = 'developer.lam@gmail.com';
      const password = 'SecurePassword123!';
      const mockUser = {
        _id: 'user_id',
        email,
        full_name: 'Lâm Nguyễn',
        auth_provider: 'local',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const result = await authService.login(email, password);

      expect(result.access_token).toBeDefined();
      expect(result.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        full_name: mockUser.full_name,
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
    });

    it('nên ném lỗi INVALID_CREDENTIALS nếu sai mật khẩu', async () => {
      const mockUser = {
        email: 'developer.lam@gmail.com',
        auth_provider: 'local',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await expect(authService.login('developer.lam@gmail.com', 'wrong_pass')).rejects.toThrow(ApiError);
    });

    it('nên ném lỗi SOCIAL_LOGIN_REQUIRED nếu tài khoản là Google OAuth', async () => {
      const mockUser = {
        email: 'developer.lam@gmail.com',
        auth_provider: 'google',
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await expect(authService.login('developer.lam@gmail.com', 'pass123')).rejects.toThrow(ApiError);
    });
  });

  // ==========================================
  // forgotPassword()
  // ==========================================
  describe('forgotPassword(email)', () => {
    it('nên tạo OTP khôi phục thành công nếu email tồn tại', async () => {
      const email = 'developer.lam@gmail.com';
      jest.spyOn(User, 'findOne').mockResolvedValue({ email });
      jest.spyOn(Otp, 'findOneAndUpdate').mockResolvedValue({});

      await authService.forgotPassword(email);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(Otp.findOneAndUpdate).toHaveBeenCalled();
    });

    it('nên ném lỗi EMAIL_NOT_FOUND nếu email chưa đăng ký', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await expect(authService.forgotPassword('unknown@gmail.com')).rejects.toThrow(ApiError);
    });
  });

  // ==========================================
  // verifyPasswordOtp()
  // ==========================================
  describe('verifyPasswordOtp(email, code)', () => {
    it('nên trả về reset_token và xóa OTP nếu trùng khớp', async () => {
      const email = 'developer.lam@gmail.com';
      const code = '654321';
      jest.spyOn(Otp, 'findOne').mockResolvedValue({ _id: 'otp_id', email, code });
      jest.spyOn(Otp, 'deleteOne').mockResolvedValue({});

      const token = await authService.verifyPasswordOtp(email, code);

      expect(token).toBeDefined();
      expect(Otp.deleteOne).toHaveBeenCalledWith({ _id: 'otp_id' });
    });
  });

  // ==========================================
  // resetPassword()
  // ==========================================
  describe('resetPassword(resetToken, password)', () => {
    let resetToken;
    const email = 'developer.lam@gmail.com';

    beforeEach(() => {
      resetToken = jwt.sign({ email }, JWT_RESET_SECRET, { expiresIn: '10m' });
    });

    it('nên cập nhật mật khẩu mới thành công nếu token hợp lệ', async () => {
      const password = 'NewSecurePassword123!';
      const mockUser = {
        email,
        save: jest.fn().mockResolvedValue({}),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await authService.resetPassword(resetToken, password);

      expect(mockUser.password_hash).toBe(password);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
