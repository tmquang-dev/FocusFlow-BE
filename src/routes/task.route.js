import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  moveTaskSchema,
  updateTaskDetailSchema,
} from '../validations/task.validation.js';
import * as taskController from '../controllers/task.controller.js';

const router = express.Router();

// Move Task (Drag & Drop)
router.patch(
  '/:taskId/move',
  authMiddleware,
  validate(moveTaskSchema),
  taskController.moveTask
);

// Update Task Detail (Title, Description, Status)
router.patch(
  '/:taskId',
  authMiddleware,
  validate(updateTaskDetailSchema),
  taskController.updateTaskDetail
);

export default router;
