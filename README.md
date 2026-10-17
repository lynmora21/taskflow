# TaskFlow — Productivity Management App

## Overview

TaskFlow is a full-stack productivity application that helps users organize projects, manage tasks, and track their progress in one centralized workspace. Users can create an account, log in securely, manage multiple projects, and organize tasks associated with each project.

## Features

- **User Authentication:** Register an account, log in, and log out.
- **Project Management:** Create, view, edit, and delete projects.
- **Task Management:** Create tasks within projects, view task details, mark tasks as complete, and delete tasks.
- **Progress Tracking:** Monitor task completion within a project.
- **Data Persistence:** Store user, project, and task data in a relational database.
- **Responsive Interface:** Use a clean dashboard to navigate projects and tasks.

## Technologies Used

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended

**Database**

Relational database managed through SQLAlchemy models and database migrations.

## Project Structure

```text
taskflow/
├── client/          # React frontend
├── server/          # Flask backend and API routes
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install Node.js and Python before starting the application.

### 1. Start the Flask backend

From the project root, open a terminal and run:

```bash
cd server
source ../.venv/bin/activate
python app.py
```

If your virtual environment is instead inside `server/`, use `source .venv/bin/activate` from that directory.

The backend runs at `http://127.0.0.1:5000`.

### 2. Start the React frontend

Open a second terminal at the project root and run:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

Keep both terminal sessions running while using the application.

## Application Goals

TaskFlow demonstrates full-stack application development by connecting a React interface to a Flask REST API, implementing authentication, managing related database resources, and supporting CRUD (Create, Read, Update, Delete) operations for projects and tasks.

## Future Improvements

- Add task filtering and sorting by due date or completion status.
- Add project-level progress summaries.
- Improve accessibility and mobile layouts.
- Add automated frontend and backend tests.