import express, { RequestHandler } from 'express';
import { getUserDashboard, getAdminDashboard, getProjectAnalytics } from '../controllers/analytics.js';
import { requireAuth } from '../utils/auth.js';

const analyticsRouter = express.Router();

// All analytics routes require authentication
analyticsRouter.use(requireAuth);

// User dashboard (accessible to all authenticated users)
analyticsRouter.get('/dashboard', getUserDashboard as RequestHandler);

// Admin dashboard (handled in controller with role check)
analyticsRouter.get('/admin-dashboard', getAdminDashboard as RequestHandler);

// Project analytics (accessible to project members/owners)
analyticsRouter.get('/project/:projectId', getProjectAnalytics as RequestHandler);

export default analyticsRouter;
