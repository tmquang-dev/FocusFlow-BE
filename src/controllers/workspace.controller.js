import * as workspaceService from '../services/workspace.service.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Create a new Workspace (POST /api/v1/workspaces)
 * Returns HTTP 210 Created
 */
export const createWorkspace = catchAsync(async (req, res) => {
  const { name } = req.body;
  const workspace = await workspaceService.createWorkspace(req.user._id, name);

  res.status(210).json({
    status: 'success',
    data: {
      workspace,
    },
  });
});

/**
 * Rename Workspace (PATCH /api/v1/workspaces/:workspaceId)
 */
export const renameWorkspace = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;
  const { name } = req.body;
  const workspace = await workspaceService.renameWorkspace(
    req.user._id,
    workspaceId,
    name
  );

  res.status(200).json({
    status: 'success',
    data: {
      workspace,
    },
  });
});

/**
 * Get user workspaces (GET /api/v1/workspaces)
 */
export const getWorkspaces = catchAsync(async (req, res) => {
  const workspaces = await workspaceService.getWorkspaces(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      workspaces,
    },
  });
});

/**
 * Delete Workspace (DELETE /api/v1/workspaces/:workspaceId)
 */
export const deleteWorkspace = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;
  await workspaceService.deleteWorkspace(req.user._id, workspaceId);

  res.status(200).json({
    status: 'success',
    message: 'Workspace deleted successfully.',
  });
});

