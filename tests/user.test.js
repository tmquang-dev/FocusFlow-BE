/* eslint-disable n/no-unpublished-import */
import { describe, afterEach, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/index.js';

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'main_access_secret_key';

describe('User Endpoints (/api/v1/users)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/users/me', () => {
    it('nên trả về thông tin user nếu access_token hợp lệ trong Cookie', async () => {
      const mockUser = {
        _id: '65c2b3f12a83f819001aaaaa',
        email: 'developer.lam@gmail.com',
        full_name: 'Lâm Nguyễn',
        avatar: null,
        is_verified: true,
        auth_provider: 'local',
        created_at: new Date(),
      };

      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(mockUser.email);
    });

    it('nên trả về thông tin user nếu token nằm trong Authorization Bearer header', async () => {
      const mockUser = {
        _id: '65c2b3f12a83f819001aaaaa',
        email: 'developer.lam@gmail.com',
        full_name: 'Lâm Nguyễn',
        avatar: null,
        is_verified: true,
        auth_provider: 'local',
        created_at: new Date(),
      };

      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(mockUser.email);
    });

    it('nên ném lỗi 401 UNAUTHORIZED nếu không có token', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('nên ném lỗi 401 INVALID_ACCESS_TOKEN nếu token hết hạn hoặc sai', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', ['access_token=invalid_token_string']);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_ACCESS_TOKEN');
    });
  });
});
