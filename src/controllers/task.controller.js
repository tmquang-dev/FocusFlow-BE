import * as taskService from '../services/task.service.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get tasks of a workspace (GET /api/v1/workspaces/:workspaceId/tasks)
 */
export const getWorkspaceTasks = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;
  const tasks = await taskService.getWorkspaceTasks(req.user._id, workspaceId);

  res.status(200).json({
    status: 'success',
    data: {
      tasks,
    },
  });
});

/**
 * Create a new task (Quick Add) (POST /api/v1/workspaces/:workspaceId/tasks)
 * Returns HTTP 210 Created
 */
export const createTask = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;
  const task = await taskService.createTask(
    req.user._id,
    workspaceId,
    req.body
  );

  res.status(210).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Move Task (Drag and Drop) (PATCH /api/v1/tasks/:taskId/move)
 */
export const moveTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const { status, order } = req.body;
  const task = await taskService.moveTask(req.user._id, taskId, {
    status,
    order,
  });

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

/**
 * Update Task Details (PATCH /api/v1/tasks/:taskId)
 */
export const updateTaskDetail = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const task = await taskService.updateTaskDetail(
    req.user._id,
    taskId,
    req.body
  );

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});
