# To-Do List Backend

This is a simple backend for a To-Do List application that allows users to add tasks without authentication. The backend is built using Node.js and Express.

## Project Structure

```
todo-backend
├── src
│   ├── app.js          # Entry point of the application
│   ├── routes
│   │   └── tasks.js    # Routes for managing tasks
│   └── models
│       └── task.js     # Task model definition
├── package.json        # NPM configuration file
├── .env                # Environment variables
└── README.md           # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd todo-backend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables, such as database connection strings.

## Usage

1. Start the server:
   ```
   npm start
   ```

2. The server will be running on `http://localhost:3000` (or the port specified in your `.env` file).

3. You can add tasks by sending a POST request to `/tasks` with the task details in the request body.

## API Endpoints

- **POST /tasks**: Add a new task.  
  Request body should include:
  - `text`: The text of the task.
  - `status`: The status of the task (e.g., "pending", "completed").

## License

This project is licensed under the MIT License.