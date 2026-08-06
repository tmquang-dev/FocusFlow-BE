import { Workspace } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Format Workspace Object for API response
 */
export const formatWorkspace = (workspace) => ({
  id: workspace._id,
  name: workspace.name,
  created_at: workspace.createdAt,
  ...(workspace.updatedAt && { updated_at: workspace.updatedAt }),
});

/**
 * Create a new Workspace
 * @param {string} userId
 * @param {string} name
 */
export const createWorkspace = async (userId, name) => {
  const workspace = await Workspace.create({
    name,
    user_id: userId,
  });

  return formatWorkspace(workspace);
};

/**
 * Rename an existing Workspace
 * @param {string} userId
 * @param {string} workspaceId
 * @param {string} name
 */
export const renameWorkspace = async (userId, workspaceId, name) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    user_id: userId,
  });

  if (!workspace) {
    throw new ApiError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found.');
  }

  workspace.name = name;
  await workspace.save();

  return formatWorkspace(workspace);
};

/**
 * Get all workspaces of user
 * @param {string} userId
 */
export const getWorkspaces = async (userId) => {
  const workspaces = await Workspace.find({ user_id: userId }).sort({
    createdAt: -1,
  });

  return workspaces.map(formatWorkspace);
};
