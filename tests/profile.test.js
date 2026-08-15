/* eslint-disable n/no-unpublished-import */
import { describe, afterEach, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/index.js';

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'main_access_secret_key';

describe('Profile & OAuth Endpoints (/api/v1/profile)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockAuthToken = (userId, email) => {
    return jwt.sign({ id: userId, email }, JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
  };

  /**
   * Helper mock cho Mongoose Query findById hỗ trợ cả `.select()` và `await User.findById()`
   */
  const setupMockUser = (mockDoc) => {
    const query = {
      select: jest.fn().mockResolvedValue(mockDoc),
      then: (resolve, reject) => Promise.resolve(mockDoc).then(resolve, reject),
    };
    return jest.spyOn(User, 'findById').mockReturnValue(query);
  };

  // =========================================================================
  // API 3.6.1: Lấy thông tin hồ sơ người dùng (GET /api/v1/profile)
  // =========================================================================
  describe('GET /api/v1/profile', () => {
    it('Block 1 (Happy Path): nên trả về thông tin profile và trạng thái social_links chuẩn hóa', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUser = {
        _id: mockUserId,
        id: mockUserId,
        email: 'lam.dev@focusflow.com',
        full_name: 'Lam dev',
        avatar_url:
          'https://focusflow-assets.s3.amazonaws.com/avatars/lam_avatar.jpg',
        social_links: {
          github: {
            provider_id: 'gh_12345',
            username: 'lam_dev',
          },
          google: {
            provider_id: null,
            email: null,
          },
        },
      };

      const token = createMockAuthToken(mockUserId, mockUser.email);
      setupMockUser(mockUser);

      const res = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBe(mockUserId);
      expect(res.body.data.user.email).toBe('lam.dev@focusflow.com');
      expect(res.body.data.user.full_name).toBe('Lam dev');
      expect(res.body.data.user.social_links.github.is_linked).toBe(true);
      expect(res.body.data.user.social_links.github.username).toBe('lam_dev');
      expect(res.body.data.user.social_links.google.is_linked).toBe(false);
      expect(res.body.data.user.social_links.google.username).toBeNull();
    });

    it('Block 4 (Auth Failure): nên ném lỗi 401 nếu không có access token', async () => {
      const res = await request(app).get('/api/v1/profile');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  // =========================================================================
  // API 3.6.2: Lưu thông tin thay đổi hồ sơ (PUT /api/v1/profile)
  // =========================================================================
  describe('PUT /api/v1/profile', () => {
    it('Block 1 (Happy Path): nên cập nhật full_name và avatar_url thành công', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        id: mockUserId,
        email: 'lam.dev@focusflow.com',
        full_name: 'Lam dev',
        avatar_url:
          'https://focusflow-assets.s3.amazonaws.com/avatars/lam_avatar.jpg',
        save: jest.fn().mockResolvedValue(true),
      };

      const token = createMockAuthToken(mockUserId, mockUserDoc.email);
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          full_name: 'Lam dev updated',
          avatar_url:
            'https://focusflow-assets.s3.amazonaws.com/avatars/lam_avatar.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.full_name).toBe('Lam dev updated');
      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it('Block 2 (Validation): nên trả về lỗi 400 nếu full_name là chuỗi rỗng', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'test@example.com',
      };
      const token = createMockAuthToken(mockUserId, 'test@example.com');
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          full_name: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('Block 2 (Validation): nên trả về lỗi 400 nếu avatar_url không đúng định dạng URL', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'test@example.com',
      };
      const token = createMockAuthToken(mockUserId, 'test@example.com');
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          avatar_url: 'invalid-url-string',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // API 3.6.3: Tải ảnh đại diện mới lên (POST /api/v1/profile/avatar)
  // =========================================================================
  describe('POST /api/v1/profile/avatar', () => {
    it('Block 1 (Happy Path): nên tải lên ảnh đại diện thành công và trả về avatar_url', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        id: mockUserId,
        email: 'lam.dev@focusflow.com',
        avatar_url: null,
        save: jest.fn().mockResolvedValue(true),
      };

      const token = createMockAuthToken(mockUserId, mockUserDoc.email);
      setupMockUser(mockUserDoc);

      const buffer = Buffer.from('fake image content');

      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', buffer, 'my_avatar.png');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.avatar_url).toBeDefined();
      expect(res.body.data.avatar_url).toContain('/uploads/avatars/');
      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it('Block 2 (Validation): nên trả về lỗi 400 nếu không đính kèm file', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'test@example.com',
      };
      const token = createMockAuthToken(mockUserId, 'test@example.com');
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('FILE_REQUIRED');
    });

    it('Block 2 (Validation & Security): nên từ chối tệp không phải định dạng ảnh (ví dụ .txt)', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'test@example.com',
      };
      const token = createMockAuthToken(mockUserId, 'test@example.com');
      setupMockUser(mockUserDoc);

      const buffer = Buffer.from('plain text malicious file');

      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', buffer, 'malicious.txt');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_FILE_TYPE');
    });
  });

  // =========================================================================
  // API 3.6.4: Hủy liên kết mạng xã hội (POST /api/v1/profile/oauth/unlink)
  // =========================================================================
  describe('POST /api/v1/profile/oauth/unlink', () => {
    it('Block 1 (Happy Path): nên hủy liên kết thành công nếu user còn mật khẩu', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'lam.dev@focusflow.com',
        password_hash: 'hashed_password_string',
        social_links: {
          github: {
            provider_id: 'gh_12345',
            username: 'lam_dev',
          },
          google: {
            provider_id: null,
          },
        },
        save: jest.fn().mockResolvedValue(true),
      };

      const token = createMockAuthToken(mockUserId, mockUserDoc.email);
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .post('/api/v1/profile/oauth/unlink')
        .set('Authorization', `Bearer ${token}`)
        .send({ provider: 'github' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe(
        'Đã hủy liên kết tài khoản GitHub thành công.'
      );
      expect(mockUserDoc.social_links.github.provider_id).toBeNull();
      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it('Block 3 (Security Constraint): nên chặn hủy liên kết nếu user không có mật khẩu và chỉ có 1 OAuth', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'oauth.only@gmail.com',
        password_hash: null, // Không có password
        social_links: {
          google: {
            provider_id: 'google_12345',
          },
          github: {
            provider_id: null,
          },
        },
        save: jest.fn(),
      };

      const token = createMockAuthToken(mockUserId, mockUserDoc.email);
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .post('/api/v1/profile/oauth/unlink')
        .set('Authorization', `Bearer ${token}`)
        .send({ provider: 'google' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CANNOT_UNLINK_PRIMARY_AUTH');
      expect(mockUserDoc.save).not.toHaveBeenCalled();
    });

    it('Block 3 (Business Logic): nên trả về lỗi 400 nếu provider chưa được liên kết', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        social_links: {
          github: {
            provider_id: null,
          },
        },
      };

      const token = createMockAuthToken(mockUserId, mockUserDoc.email);
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .post('/api/v1/profile/oauth/unlink')
        .set('Authorization', `Bearer ${token}`)
        .send({ provider: 'github' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OAUTH_NOT_LINKED');
    });

    it('Block 2 (Validation): nên trả về 400 nếu provider không hợp lệ (ví dụ facebook)', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'test@example.com',
      };
      const token = createMockAuthToken(mockUserId, 'test@example.com');
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .post('/api/v1/profile/oauth/unlink')
        .set('Authorization', `Bearer ${token}`)
        .send({ provider: 'facebook' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // API 3.6.5: Thực hiện liên kết tài khoản mạng xã hội mới (POST /api/v1/profile/oauth/link)
  // =========================================================================
  describe('POST /api/v1/profile/oauth/link', () => {
    it('Block 1 (Happy Path): nên liên kết tài khoản Google thành công', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'lam.dev@focusflow.com',
        social_links: {
          github: { provider_id: null },
          google: { provider_id: null },
        },
        save: jest.fn().mockResolvedValue(true),
      };

      const token = createMockAuthToken(mockUserId, mockUserDoc.email);
      setupMockUser(mockUserDoc);
      jest.spyOn(User, 'findOne').mockResolvedValue(null); // Không bị trùng lặp user khác

      const res = await request(app)
        .post('/api/v1/profile/oauth/link')
        .set('Authorization', `Bearer ${token}`)
        .send({
          provider: 'google',
          auth_code: 'mock_google_auth_code_123',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe(
        'Đã liên kết tài khoản Google thành công.'
      );
      expect(mockUserDoc.social_links.google.provider_id).toBeDefined();
      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it('Block 3 (Security Constraint): nên trả về lỗi 409 nếu tài khoản OAuth đã thuộc về user khác', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const anotherUserId = '65c2b3f12a83f819001bbbbb';

      const mockUserDoc = {
        _id: mockUserId,
        email: 'lam.dev@focusflow.com',
        social_links: {},
        save: jest.fn(),
      };

      const existingLinkedUser = {
        _id: anotherUserId,
        email: 'other_user@gmail.com',
      };

      const token = createMockAuthToken(mockUserId, mockUserDoc.email);
      setupMockUser(mockUserDoc);
      jest.spyOn(User, 'findOne').mockResolvedValue(existingLinkedUser);

      const res = await request(app)
        .post('/api/v1/profile/oauth/link')
        .set('Authorization', `Bearer ${token}`)
        .send({
          provider: 'github',
          auth_code: 'mock_github_auth_code_123',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ACCOUNT_ALREADY_LINKED');
      expect(mockUserDoc.save).not.toHaveBeenCalled();
    });

    it('Block 2 (Validation): nên trả về lỗi 400 nếu thiếu auth_code', async () => {
      const mockUserId = '65c2b3f12a83f819001aaaaa';
      const mockUserDoc = {
        _id: mockUserId,
        email: 'test@example.com',
      };
      const token = createMockAuthToken(mockUserId, 'test@example.com');
      setupMockUser(mockUserDoc);

      const res = await request(app)
        .post('/api/v1/profile/oauth/link')
        .set('Authorization', `Bearer ${token}`)
        .send({
          provider: 'google',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
