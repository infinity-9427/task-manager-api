import express from 'express';
import { createUser, getUser, updateUser, deleteUser } from '../controllers/users.js';
const userRouter = express.Router();
// User routes
userRouter.post('/', createUser);
userRouter.get('/:id', getUser);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);
export default userRouter;
//# sourceMappingURL=users.js.map