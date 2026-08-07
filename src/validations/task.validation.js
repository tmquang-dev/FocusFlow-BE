import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Task title is required')
      .max(200, 'Task title cannot exceed 200 characters'),
    description: z.string().optional(),
    status: z.enum(['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'DONE']).optional(),
  }),
});

export const moveTaskSchema = z.object({
  body: z.object({
    status: z.enum(['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'DONE']),
    order: z.number().min(0, 'Order must be a non-negative number'),
  }),
});

export const updateTaskDetailSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Task title cannot exceed 200 characters')
      .optional(),
    description: z.string().optional(),
    status: z.enum(['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'DONE']).optional(),
    order: z.number().min(0).optional(),
  }),
});
