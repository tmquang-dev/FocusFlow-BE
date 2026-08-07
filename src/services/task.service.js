import { Task, Workspace } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Format Task object for API response
 */
export const formatTask = (task) => ({
  id: task._id,
  task_num: task.task_num,
  title: task.title,
  description: task.description || '',
  status: task.status,
  order: task.order,
  created_at: task.createdAt,
  ...(task.updatedAt && { updated_at: task.updatedAt }),
});

/**
 * Get all tasks of a workspace
 * @param {string} userId
 * @param {string} workspaceId
 */
export const getWorkspaceTasks = async (userId, workspaceId) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    user_id: userId,
  });

  if (!workspace) {
    throw new ApiError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found.');
  }

  const tasks = await Task.find({
    workspace_id: workspaceId,
    user_id: userId,
    is_deleted: false,
  }).sort({ status: 1, order: 1, createdAt: 1 });

  return tasks.map(formatTask);
};

/**
 * Create a new task in a workspace (Quick Add)
 * @param {string} userId
 * @param {string} workspaceId
 * @param {object} taskData { title, description, status }
 */
export const createTask = async (userId, workspaceId, taskData) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    user_id: userId,
  });

  if (!workspace) {
    throw new ApiError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found.');
  }

  const status = taskData.status || 'BACKLOG';

  // Find last task order in the specified column
  const lastTask = await Task.findOne({
    workspace_id: workspaceId,
    status,
    is_deleted: false,
  }).sort({ order: -1 });

  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    workspace_id: workspaceId,
    user_id: userId,
    title: taskData.title,
    description: taskData.description || '',
    status,
    order,
  });

  return formatTask(task);
};

/**
 * Move task (Drag and Drop status & order update)
 * @param {string} userId
 * @param {string} taskId
 * @param {object} moveData { status, order }
 */
export const moveTask = async (userId, taskId, { status, order }) => {
  const task = await Task.findOne({
    _id: taskId,
    user_id: userId,
    is_deleted: false,
  });

  if (!task) {
    throw new ApiError(404, 'TASK_NOT_FOUND', 'Task not found.');
  }

  task.status = status;
  task.order = order;
  await task.save();

  return formatTask(task);
};

/**
 * Update task details (title, description, status, order)
 * @param {string} userId
 * @param {string} taskId
 * @param {object} updates
 */
export const updateTaskDetail = async (userId, taskId, updates) => {
  const task = await Task.findOne({
    _id: taskId,
    user_id: userId,
    is_deleted: false,
  });

  if (!task) {
    throw new ApiError(404, 'TASK_NOT_FOUND', 'Task not found.');
  }

  if (updates.title !== undefined) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.status !== undefined) task.status = updates.status;
  if (updates.order !== undefined) task.order = updates.order;

  await task.save();

  return formatTask(task);
};
