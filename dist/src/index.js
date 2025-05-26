import { createApp } from "./app.js";
import userRouter from "./routes/users.js";
import taskRouter from "./routes/tasks.js";
import authRouter from './routes/auth.js';
const PORT = process.env.PORT || 5000;
const { app, port } = createApp({ port: PORT });
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/auth', authRouter);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map