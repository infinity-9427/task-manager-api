# Task Manager API

This API allows users to manage tasks, including creating, reading, updating, and deleting users and their associated tasks. It also provides authentication.

## Project Setup

1.  **Environment Variables:**
    Create a `.env` file in the root directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your specific configurations for:
    *   `UPLOAD_FOLDER`
    *   `CLOUDINARY_CLOUD_NAME`
    *   `CLOUDINARY_API_KEY`
    *   `CLOUDINARY_API_SECRET`
    *   `PORT`
    *   `CORS_ORIGIN`
    *   `DATABASE_URL` (PostgreSQL connection string)

2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run Migrations (if using Prisma):**
    ```bash
    pnpm prisma migrate dev
    ```

4.  **Start the development server:**
    ```bash
    pnpm run dev
    ```
    The server will start, typically on `http://localhost:3200` (or the `PORT` specified in your `.env`).

5.  **Build for production:**
    ```bash
    pnpm run build
    ```

6.  **Start in production:**
    ```bash
    pnpm start
    ```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Users

Endpoints for managing users. Based on [users.ts](http://_vscodecontentref_/0) and [users.ts](http://_vscodecontentref_/1).

*   **`POST /users`**: Create a new user.
    *   **Request Body (form-data for image upload, or JSON if no image):**
        *   [username](http://_vscodecontentref_/2) (string, required, min 3, max 30)
        *   [password](http://_vscodecontentref_/3) (string, required, min 6)
        *   [image](http://_vscodecontentref_/4) (file, optional) - If sending JSON, [image](http://_vscodecontentref_/5) can be an object `{ "url": "...", "public_id": "..." }` or empty `{}`.
    *   **Response (Success 201):**
        ```json
        {
          "user": {
            "id": 1,
            "username": "newuser",
            "image": { "url": "http://...", "public_id": "..." } // or {}
          }
        }
        ```
    *   **Example (curl with image):**
        ```bash
        curl -X POST http://localhost:3200/api/v1/users \
        -F "username=newuser" \
        -F "password=securepassword" \
        -F "image=@/path/to/your/image.jpg"
        ```
    *   **Example (curl without image):**
        ```bash
        curl -X POST http://localhost:3200/api/v1/users \
        -H "Content-Type: application/json" \
        -d '{
              "username": "anotheruser",
              "password": "password123"
            }'
        ```

*   **`GET /users/:id`**: Get a user by ID.
    *   **Response (Success 200):**
        ```json
        {
          "id": 1,
          "username": "testuser",
          "image": { "url": "...", "public_id": "..." }
        }
        ```
    *   **Example (curl):**
        ```bash
        curl http://localhost:3200/api/v1/users/1
        ```

*   **`PUT /users/:id`**: Update a user.
    *   **Request Body (form-data for image upload, or JSON if no image change or only text fields):**
        *   [username](http://_vscodecontentref_/6) (string, optional)
        *   [password](http://_vscodecontentref_/7) (string, optional, min 6)
        *   [image](http://_vscodecontentref_/8) (file, optional, or JSON object `{ "url": "...", "public_id": "..." }` or `{}` to remove)
    *   **Response (Success 200):**
        ```json
        {
          "user": {
            "id": 1,
            "username": "updateduser",
            "image": { "url": "...", "public_id": "..." }
          }
        }
        ```
    *   **Example (curl, update username):**
        ```bash
        curl -X PUT http://localhost:3200/api/v1/users/1 \
        -H "Content-Type: application/json" \
        -d '{
              "username": "updatedusername"
            }'
        ```

*   **`DELETE /users/:id`**: Delete a user and their associated tasks.
    *   **Response (Success 200):**
        ```json
        {
          "message": "User and associated tasks deleted successfully"
        }
        ```
    *   **Example (curl):**
        ```bash
        curl -X DELETE http://localhost:3200/api/v1/users/1
        ```


### Authentication

Endpoints related to user authentication.

*   **`POST /auth/login`**: Login a user.
    *   **Request Body:**
        ```json
        {
          "username": "testuser",
          "password": "password123"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "accessToken": "your_access_token",
          "refreshToken": "your_refresh_token"
        }
        ```
    *   **Example (curl):**
        ```bash
        curl -X POST http://localhost:3200/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{
              "username": "testuser",
              "password": "password123"
            }'
        ```


### Tasks

Endpoints for managing tasks. Based on [tasks.ts](http://_vscodecontentref_/9) and [tasks.ts](http://_vscodecontentref_/10).

*   **`POST /tasks`**: Create a new task.
    *   **Request Body:**
        ```json
        {
          "title": "New Task Title",
          "description": "Detailed description of the task.",
          "status": "PENDING", // PENDING, IN_PROGRESS, COMPLETED
          "priority": "MEDIUM", // LOW, MEDIUM, HIGH, URGENT (optional)
          "userId": 1 // ID of the user this task belongs to
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "id": 1,
          "title": "New Task Title",
          "description": "Detailed description of the task.",
          "status": "PENDING",
          "priority": "MEDIUM",
          "userId": 1
        }
        ```
    *   **Example (curl):**
        ```bash
        curl -X POST http://localhost:3200/api/v1/tasks \
        -H "Content-Type: application/json" \
        -d '{
              "title": "Finish API docs",
              "description": "Complete all sections of the API documentation.",
              "status": "IN_PROGRESS",
              "priority": "HIGH",
              "userId": 1
            }'
        ```

*   **`GET /tasks`**: Get all tasks.
    *   **Response (Success 200):**
        ```json
        [
          {
            "id": 1,
            "title": "Task 1",
            "description": "Description 1",
            "status": "PENDING",
            "priority": "LOW",
            "userId": 1
          },
          {
            "id": 2,
            "title": "Task 2",
            "description": "Description 2",
            "status": "COMPLETED",
            "priority": "MEDIUM",
            "userId": 1
          }
        ]
        ```
    *   **Example (curl):**
        ```bash
        curl http://localhost:3200/api/v1/tasks
        ```

*   **`GET /tasks/:id`**: Get a task by ID.
    *   **Response (Success 200):**
        ```json
        {
          "id": 1,
          "title": "Task 1",
          "description": "Description 1",
          "status": "PENDING",
          "priority": "LOW",
          "userId": 1
        }
        ```
    *   **Example (curl):**
        ```bash
        curl http://localhost:3200/api/v1/tasks/1
        ```

*   **`PUT /tasks/:id`**: Update a task.
    *   **Request Body (fields are optional):**
        ```json
        {
          "title": "Updated Task Title",
          "description": "Updated description.",
          "status": "COMPLETED",
          "priority": "URGENT"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "id": 1,
          "title": "Updated Task Title",
          "description": "Updated description.",
          "status": "COMPLETED",
          "priority": "URGENT",
          "userId": 1
        }
        ```
    *   **Example (curl):**
        ```bash
        curl -X PUT http://localhost:3200/api/v1/tasks/1 \
        -H "Content-Type: application/json" \
        -d '{
              "status": "COMPLETED",
              "priority": "LOW"
            }'
        ```

*   **`DELETE /tasks/:id`**: Delete a task.
    *   **Response (Success 200):**
        ```json
        {
          "message": "Task deleted"
        }
        ```
    *   **Example (curl):**
        ```bash
        curl -X DELETE http://localhost:3200/api/v1/tasks/1
        ```

## Data Models

Defined in [schema.prisma](http://_vscodecontentref_/11).

### User
```prisma
model User {
  id        Int    @id @default(autoincrement())
  username  String @unique
  password  String // Hashed
  image     Json   // { "url": "...", "public_id": "..." }
  tasks     Task[]
}
```

### Task
```prisma
model Task {
  id          Int         @id @default(autoincrement())
  title       String
  description String
  status      TaskStatus  // PENDING, IN_PROGRESS, COMPLETED
  priority    Priority?   // LOW, MEDIUM, HIGH, URGENT
  user        User        @relation(fields: [userId], references: [id])
  userId      Int
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```