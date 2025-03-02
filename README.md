# Taskwise 📝

Taskwise is a smart task management application that leverages AI to help users organize, prioritize, and complete their tasks effectively. With intelligent features like natural language task creation, priority prediction, and reminders, Taskwise ensures that your to-do list is always on track!

## Features 🚀

- **Task Management**: Create, update, and delete tasks with ease.
- **AI-Powered Task Creation**: Add tasks using natural language input (e.g., "Remind me to submit the report by Friday").
- **Intelligent Prioritization**: Analyze and automatically adjust task priorities using AI.
- **Deadline Tracking**: Set task deadlines and receive reminders before due dates.
- **Push Notifications**: Get real-time reminders and updates using Firebase.
- **User Authentication**: Secure login and user management with JWT.
- **Custom Sorting**: Filter and sort tasks based on deadlines, priorities, and status.

## Technology Stack 🛠️

### Backend:
- **Node.js**: Server-side runtime environment.
- **Express**: Framework for building RESTful APIs.
- **MongoDB with Mongoose**: Database for task and user management.
- **Hugging Face Inference**: AI for NLP and prioritization.

### Frontend:
- **React with Vite**: Lightning-fast client-side app development.
- **TypeScript**: Strongly typed JavaScript for both frontend and backend.

### Notifications:
- **Firebase Cloud Messaging (FCM)**: Push notifications for reminders.

## Getting Started 🚧

### Prerequisites
- **Node.js**: Version 16.x or higher.
- **MongoDB Atlas**: Hosted MongoDB database.
- **Hugging Face API Key**: For AI task analysis.
- **Firebase Project**: For push notifications.
- **Postman (Optional)**: For testing API endpoints.

### 1. Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/taskwise.git
   cd taskwise

### 2. Install dependencies:
1. install:
   ```bash
   npm install


### 3. Create a .env file in the root directory and add the following variables:

1. PORT=3000
2. MONGODB_URI=your-mongodb-uri
3. HUGGINGFACE_API_KEY=your-hugging-face-api-key
4. FIREBASE_SERVER_KEY=your-firebase-server-key

### 4. Start the development server:
1. npm:
    ```bash
   npm run dev


### 5. (Optional) Build the frontend for production :
1. npm:
    ```bash
   npm run build

## Api endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/tasks` | Get all tasks for the user |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/create-from-nlp` | Create a task from natural text |
| POST | `/api/prioritize-tasks` | Task prioritization |

## Roadmap 🛤️
### Phase 1: Core Functionality
User authentication with JWT
Basic task CRUD operations
Task prioritization and sorting

### Phase 2: Notifications & Reminders
Task reminders using cron jobs
Push notifications with Firebase

### Phase 3: AI Integration
Natural language task creation (NLP)
AI-powered task prioritization


## Contributing 🤝
We welcome contributions to Taskwise! If you'd like to help, please fork the repository, make your changes, and submit a pull request.


## License 📜
This project is licensed under the MIT License.

## Contact 📧
For questions or suggestions, please reach out:

## Email: isaacchimarokeanyim@gmail.com
## whatsapp: +234 8058958751



