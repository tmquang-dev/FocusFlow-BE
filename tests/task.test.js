/* eslint-disable n/no-unpublished-import */
import { describe, afterEach, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { Workspace, Task, User } from '../src/models/index.js';

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'main_access_secret_key';

describe('Task Endpoints (/api/v1/workspaces/:workspaceId/tasks & /api/v1/tasks)', () => {
  const userId = '65c2b3f12a83f819001aaaaa';
  const workspaceId = '65c2b3f12a83f819001bbbbb';
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

  const mockWorkspace = {
    _id: workspaceId,
    name: 'Dự án Freelance Web',
    user_id: userId,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/workspaces/:workspaceId/tasks', () => {
    it('nên lấy danh sách Task của workspace thành công', async () => {
      const mockTasks = [
        {
          _id: '65c2b3f12a83f819001abcd2',
          task_num: 1,
          title: 'Cấu hình database cho dự án',
          description: 'Cài đặt MongoDB và viết Mongoose schema',
          status: 'TO_DO',
          order: 0,
          createdAt: new Date('2026-02-14T08:10:00.000Z'),
        },
      ];

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Workspace, 'findOne').mockResolvedValue(mockWorkspace);
      jest.spyOn(Task, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTasks),
      });

      const res = await request(app)
        .get(`/api/v1/workspaces/${workspaceId}/tasks`)
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].task_num).toBe(1);
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/tasks', () => {
    it('nên tạo nhanh task mới thành công và trả về HTTP 210 Created', async () => {
      const mockCreatedTask = {
        _id: '65c2b3f12a83f819001abcd3',
        task_num: 2,
        title: 'Thiết kế giao diện đăng nhập',
        description: '',
        status: 'BACKLOG',
        order: 1,
        createdAt: new Date('2026-02-14T08:15:00.000Z'),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Workspace, 'findOne').mockResolvedValue(mockWorkspace);
      jest.spyOn(Task, 'findOne').mockReturnValue({
        sort: jest.fn().mockResolvedValue({ order: 0 }),
      });
      jest.spyOn(Task, 'create').mockResolvedValue(mockCreatedTask);

      const res = await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/tasks`)
        .set('Cookie', [`access_token=${token}`])
        .send({ title: 'Thiết kế giao diện đăng nhập' });

      expect(res.status).toBe(210);
      expect(res.body.status).toBe('success');
      expect(res.body.data.task.title).toBe('Thiết kế giao diện đăng nhập');
    });
  });

  describe('PATCH /api/v1/tasks/:taskId/move', () => {
    it('nên cập nhật trạng thái & vị trí kéo thả task thành công', async () => {
      const mockTask = {
        _id: '65c2b3f12a83f819001abcd3',
        task_num: 2,
        title: 'Thiết kế giao diện',
        status: 'TO_DO',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date('2026-02-14T08:20:00.000Z'),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);

      const res = await request(app)
        .patch('/api/v1/tasks/65c2b3f12a83f819001abcd3/move')
        .set('Cookie', [`access_token=${token}`])
        .send({ status: 'IN_PROGRESS', order: 0 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.task.status).toBe('IN_PROGRESS');
      expect(res.body.data.task.order).toBe(0);
    });
  });

  describe('PATCH /api/v1/tasks/:taskId', () => {
    it('nên cập nhật thông tin chi tiết task (title, description, status) thành công', async () => {
      const mockTask = {
        _id: '65c2b3f12a83f819001abcd3',
        task_num: 2,
        title: 'Tên cũ',
        description: 'Mô tả cũ',
        status: 'TO_DO',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date('2026-02-14T08:25:00.000Z'),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);

      const res = await request(app)
        .patch('/api/v1/tasks/65c2b3f12a83f819001abcd3')
        .set('Cookie', [`access_token=${token}`])
        .send({
          title: 'Tên task cập nhật mới',
          description: 'Mô tả chi tiết cập nhật',
          status: 'DONE',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.task.title).toBe('Tên task cập nhật mới');
      expect(res.body.data.task.description).toBe('Mô tả chi tiết cập nhật');
      expect(res.body.data.task.status).toBe('DONE');
    });
  });

  describe('DELETE /api/v1/tasks/:taskId', () => {
    it('nếu xóa task thành công (soft delete)', async () => {
      const mockTask = {
        _id: '65c2b3f12a83f819001abcd3',
        is_deleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);

      const res = await request(app)
        .delete('/api/v1/tasks/65c2b3f12a83f819001abcd3')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Task deleted successfully.');
      expect(mockTask.is_deleted).toBe(true);
    });
  });

  describe('GET /api/v1/tasks/:taskId', () => {
    it('nên lấy thông tin chi tiết của 1 Task theo ID thành công', async () => {
      const mockTask = {
        _id: '65c2b3f12a83f819001abcd3',
        task_num: 5,
        title: 'Thiết kế giao diện Task Modal',
        description: 'Chi tiết mô tả task modal',
        status: 'IN_PROGRESS',
        order: 0,
        createdAt: new Date(),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);

      const res = await request(app)
        .get('/api/v1/tasks/65c2b3f12a83f819001abcd3')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.task.task_num).toBe(5);
      expect(res.body.data.task.title).toBe('Thiết kế giao diện Task Modal');
    });
  });
});
