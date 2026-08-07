import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import workspaceRoute from './workspace.route.js';
import taskRoute from './task.route.js';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/workspaces', workspaceRoute);
router.use('/tasks', taskRoute);

export default router;
