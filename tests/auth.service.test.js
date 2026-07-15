import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import * as authService from '../src/services/auth.service.js';
import { User, Workspace, Task, Otp } from '../src/models/index.js';
import ApiError from '../src/utils/ApiError.js';

const JWT_REGISTRATION_SECRET = process.env.JWT_REGISTRATION_SECRET || 'temp_registration_secret_key';

describe('UNIT TESTS: AUTH SERVICE LOGIC', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // ==========================================
  // Unit tests for sendOtp()
  // ==========================================
  describe('sendOtp(email)', () => {
    it('nên tạo OTP và gửi email thành công nếu email chưa đăng ký', async () => {
      const email = 'new.user@gmail.com';
      
      const findUserSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const updateOtpSpy = jest.spyOn(Otp, 'findOneAndUpdate').mockResolvedValue({});

      await authService.sendOtp(email);

      expect(findUserSpy).toHaveBeenCalledWith({ email });
      expect(updateOtpSpy).toHaveBeenCalledWith(
        { email },
        expect.any(Object),
        { upsert: true, new: true }
      );
    });

    it('nên ném lỗi ApiError EMAIL_ALREADY_EXISTS nếu email đã được sử dụng', async () => {
      const email = 'existing.user@gmail.com';
      jest.spyOn(User, 'findOne').mockResolvedValue({ email });

      await expect(authService.sendOtp(email)).rejects.toThrow(ApiError);
      await expect(authService.sendOtp(email)).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    });
  });

  // ==========================================
  // Unit tests for verifyOtp()
  // ==========================================
  describe('verifyOtp(email, code)', () => {
    it('nên trả về registration_token và xóa OTP nếu thông tin khớp', async () => {
      const email = 'user@gmail.com';
      const code = '123456';
      const mockOtp = { _id: 'otp_id', email, code };

      const findOtpSpy = jest.spyOn(Otp, 'findOne').mockResolvedValue(mockOtp);
      const deleteOtpSpy = jest.spyOn(Otp, 'deleteOne').mockResolvedValue({});

      const token = await authService.verifyOtp(email, code);

      expect(token).toBeDefined();
      expect(findOtpSpy).toHaveBeenCalledWith({ email, code });
      expect(deleteOtpSpy).toHaveBeenCalledWith({ _id: 'otp_id' });

      // Giải mã token để verify nội dung
      const decoded = jwt.verify(token, JWT_REGISTRATION_SECRET);
      expect(decoded.email).toBe(email);
    });

    it('nên ném lỗi ApiError INVALID_OTP nếu mã OTP không khớp hoặc hết hạn', async () => {
      const email = 'user@gmail.com';
      const code = '999999';

      jest.spyOn(Otp, 'findOne').mockResolvedValue(null);

      await expect(authService.verifyOtp(email, code)).rejects.toThrow(ApiError);
      await expect(authService.verifyOtp(email, code)).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'INVALID_OTP',
      });
    });
  });

  // ==========================================
  // Unit tests for completeRegister()
  // ==========================================
  describe('completeRegister(registrationToken, password)', () => {
    let registrationToken;
    const email = 'developer.lam@gmail.com';

    beforeEach(() => {
      registrationToken = jwt.sign({ email }, JWT_REGISTRATION_SECRET, {
        expiresIn: '10m',
      });
    });

    it('nên tạo User, Workspace và các Task onboarding thành công nếu token hợp lệ', async () => {
      const password = 'SecurePassword123!';
      const mockUser = { _id: 'user_id', email, full_name: 'developer.lam' };
      const mockWorkspace = { _id: 'workspace_id', name: 'Workspace 1' };

      const findUserSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const createUserSpy = jest.spyOn(User, 'create').mockResolvedValue(mockUser);
      const createWorkspaceSpy = jest.spyOn(Workspace, 'create').mockResolvedValue(mockWorkspace);
      const createTasksSpy = jest.spyOn(Task, 'create').mockResolvedValue([]);

      const result = await authService.completeRegister(registrationToken, password);

      expect(result.access_token).toBeDefined();
      expect(result.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        full_name: mockUser.full_name,
      });

      expect(findUserSpy).toHaveBeenCalledWith({ email });
      expect(createUserSpy).toHaveBeenCalledWith({
        email,
        password_hash: password,
        full_name: 'developer.lam',
        auth_provider: 'local',
      });
      expect(createWorkspaceSpy).toHaveBeenCalledWith({
        name: 'Workspace 1',
        user_id: mockUser._id,
      });
      expect(createTasksSpy).toHaveBeenCalled();
    });

    it('nên ném lỗi ApiError INVALID_TOKEN nếu token bị chỉnh sửa hoặc hết hạn', async () => {
      const invalidToken = 'invalid_token_string';
      const password = 'SecurePassword123!';

      await expect(authService.completeRegister(invalidToken, password)).rejects.toThrow(ApiError);
      await expect(authService.completeRegister(invalidToken, password)).rejects.toMatchObject({
        statusCode: 401,
        errorCode: 'INVALID_TOKEN',
      });
    });

    it('nên ném lỗi ApiError EMAIL_ALREADY_EXISTS nếu user đã được tạo trước đó', async () => {
      const password = 'SecurePassword123!';
      jest.spyOn(User, 'findOne').mockResolvedValue({ email });

      await expect(authService.completeRegister(registrationToken, password)).rejects.toThrow(ApiError);
      await expect(authService.completeRegister(registrationToken, password)).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    });
  });
});
