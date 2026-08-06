import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createWorkspaceSchema,
  renameWorkspaceSchema,
} from '../validations/workspace.validation.js';
import { createTaskSchema } from '../validations/task.validation.js';
import * as workspaceController from '../controllers/workspace.controller.js';
import * as taskController from '../controllers/task.controller.js';

const router = express.Router();

// Workspace Endpoints
router.post(
  '/',
  authMiddleware,
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace
);
router.get('/', authMiddleware, workspaceController.getWorkspaces);
router.patch(
  '/:workspaceId',
  authMiddleware,
  validate(renameWorkspaceSchema),
  workspaceController.renameWorkspace
);

// Workspace Tasks Endpoints
router.get('/:workspaceId/tasks', authMiddleware, taskController.getWorkspaceTasks);
router.post(
  '/:workspaceId/tasks',
  authMiddleware,
  validate(createTaskSchema),
  taskController.createTask
);

export default router;
