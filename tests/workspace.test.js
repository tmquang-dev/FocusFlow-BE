/* eslint-disable n/no-unpublished-import */
import { describe, afterEach, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { Workspace, Task, Counter, User } from '../src/models/index.js';

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'main_access_secret_key';

describe('Workspace Endpoints (/api/v1/workspaces)', () => {
  const userId = '65c2b3f12a83f819001aaaaa';
  const token = jwt.sign(
    { id: userId, email: 'user@example.com' },
    JWT_ACCESS_SECRET,
    {
      expiresIn: '15m',
    }
  );

  const mockUser = {
    _id: userId,
    email: 'user@example.com',
    full_name: 'Test User',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/workspaces', () => {
    it('nên tạo workspace mới thành công và trả về HTTP 210 Created', async () => {
      const mockWorkspace = {
        _id: '65c2b3f12a83f819001bbbbb',
        name: 'Dự án Freelance Web',
        user_id: userId,
        createdAt: new Date('2026-02-14T08:00:00.000Z'),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Workspace, 'create').mockResolvedValue(mockWorkspace);

      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Cookie', [`access_token=${token}`])
        .send({ name: 'Dự án Freelance Web' });

      expect(res.status).toBe(210);
      expect(res.body.status).toBe('success');
      expect(res.body.data.workspace).toEqual({
        id: mockWorkspace._id,
        name: mockWorkspace.name,
        created_at: mockWorkspace.createdAt.toISOString(),
      });
    });

    it('nên trả về 400 Bad Request nếu thiếu tên workspace', async () => {
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Cookie', [`access_token=${token}`])
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/v1/workspaces/:workspaceId', () => {
    it('nên đổi tên workspace thành công (renameWorkspace)', async () => {
      const mockWorkspace = {
        _id: '65c2b3f12a83f819001bbbbb',
        name: 'Tên Cũ',
        user_id: userId,
        createdAt: new Date('2026-02-14T08:00:00.000Z'),
        updatedAt: new Date('2026-02-14T08:05:00.000Z'),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Workspace, 'findOne').mockResolvedValue(mockWorkspace);

      const res = await request(app)
        .patch('/api/v1/workspaces/65c2b3f12a83f819001bbbbb')
        .set('Cookie', [`access_token=${token}`])
        .send({ name: 'Tên Mới Renovated' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.workspace.name).toBe('Tên Mới Renovated');
    });

    it('nên ném lỗi 404 nếu workspace không tồn tại hoặc không thuộc sở hữu của user', async () => {
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Workspace, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/workspaces/65c2b3f12a83f819001bbbbb')
        .set('Cookie', [`access_token=${token}`])
        .send({ name: 'Tên Mới' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('WORKSPACE_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/workspaces/:workspaceId', () => {
    it('nên xóa workspace thành công', async () => {
      const mockWorkspace = {
        _id: '65c2b3f12a83f819001bbbbb',
        name: 'Dự án Cũ',
        user_id: userId,
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Workspace, 'findOne').mockResolvedValue(mockWorkspace);
      jest.spyOn(Task, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
      jest.spyOn(Counter, 'deleteOne').mockResolvedValue({ deletedCount: 1 });
      jest.spyOn(Workspace, 'deleteOne').mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .delete('/api/v1/workspaces/65c2b3f12a83f819001bbbbb')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Workspace deleted successfully.');
    });
  });
});
