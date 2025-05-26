import express from 'express';
import userRoutes from './users.js';
import taskRoutes from './tasks.js';
const router = express.Router();
// Mount specific route modules
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
export default router;
//# sourceMappingURL=index.js.map