import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(100, 'Workspace name cannot exceed 100 characters'),
  }),
});

export const renameWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(100, 'Workspace name cannot exceed 100 characters'),
  }),
});
