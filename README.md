# TaskFlow — Productivity Management App

## Overview

TaskFlow is a full-stack productivity application that helps users organize projects, manage tasks, and track progress in one centralized workspace. Users can register an account, log in securely, manage their projects, and organize tasks associated with each project.

## Features

- **User Authentication:** Register, log in, and log out.
- **Project Management:** Create, view, edit, and delete projects.
- **Task Management:** Create tasks within projects, view tasks, update task details, mark tasks as complete, and delete tasks.
- **Progress Tracking:** Track task completion within projects.
- **Pagination:** Retrieve projects and tasks in manageable pages through API query parameters.
- **Data Persistence:** Store users, projects, and tasks in PostgreSQL.
- **Ownership Protection:** Restrict access to projects and tasks based on the authenticated user.
- **Responsive Interface:** Navigate projects and tasks through a dashboard.

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
- Flask-CORS

**Database**
- PostgreSQL 16
- SQLAlchemy ORM
- Alembic database migrations

## Project Structure

```text
taskflow/
├── client/                 # React frontend
├── server/
│   ├── app.py              # Flask application
│   ├── models.py           # Database models
│   ├── routes/             # Authentication, project, and task APIs
│   ├── migrations/         # Database migration history
│   └── .env                # Local environment variables (not committed)
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running TaskFlow:

- Node.js and npm
- Python 3
- PostgreSQL 16

### 1. Set Up PostgreSQL

Install PostgreSQL 16 with Homebrew on macOS:

```bash
brew install postgresql@16
brew services start postgresql@16
```

Create the TaskFlow database:

```bash
"$(brew --prefix)/opt/postgresql@16/bin/psql" postgres
```

At the PostgreSQL prompt, run:

```sql
CREATE DATABASE taskflow;
```

Exit the PostgreSQL prompt:

```sql
\q
```

If the database already exists, do not create it again.

### 2. Configure the Backend

From the project root, create and activate a Python virtual environment if you do not already have one:

```bash
python3 -m venv server/.venv
source server/.venv/bin/activate
```

Install the backend dependencies:

```bash
pip install Flask Flask-SQLAlchemy Flask-Migrate Flask-CORS Flask-JWT-Extended python-dotenv "psycopg[binary]"
```

Create a `server/.env` file containing:

```dotenv
DATABASE_URL=postgresql+psycopg://localhost/taskflow
JWT_SECRET_KEY=replace-with-a-generated-secret
```

Generate a secure JWT secret by running:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Replace the placeholder with the generated value. Keep this secret private and never commit `.env` files to GitHub.

The PostgreSQL connection string above assumes a local PostgreSQL setup using your macOS username as the database role. Adjust it if your PostgreSQL configuration differs.

### 3. Initialize the Database Schema

From the project root, with the virtual environment activated, run:

```bash
flask --app server/app.py db upgrade
```

This applies the existing migrations and creates the database tables.

### 4. Start the Flask Backend

From the project root, run:

```bash
flask --app server/app.py run --port 5000
```

The API runs at `http://127.0.0.1:5000`.

You can verify that it is running by visiting:

`http://127.0.0.1:5000/api/health`

### 5. Start the React Frontend

Open a second terminal at the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

Keep both the Flask backend and React frontend running while using the application.

## API Functionality

The Flask REST API supports:

- User registration and authentication
- Listing and managing projects
- Listing and managing tasks associated with projects
- Updating task completion status
- Pagination on project and task list endpoints
- Authenticated, ownership-based access to user resources

List endpoints support `page` and `per_page` query parameters. For example:

```text
/api/projects?page=1&per_page=10
/api/projects/1/tasks?page=1&per_page=10
```

Pagination information is returned through response headers.

## Application Goals

TaskFlow demonstrates full-stack application development by connecting a React interface to a Flask REST API, implementing authentication, managing related relational database resources, and supporting CRUD (Create, Read, Update, Delete) operations for projects and tasks.

## Future Improvements

- Add frontend pagination controls.
- Add task filtering and sorting by due date or completion status.
- Add project-level progress summaries.
- Expand automated frontend and backend testing.
- Improve accessibility and mobile layouts.
- Deploy the application for public access.
# TaskFlow — Productivity Management App


## Overview


TaskFlow is a full-stack productivity application that helps users organize projects, manage tasks, and track progress in one centralized workspace. Users can register an account, log in securely, manage their projects, and organize tasks associated with each project.


## Features


- **User Authentication:** Register, log in, and log out.
- **Project Management:** Create, view, edit, and delete projects.
- **Task Management:** Create tasks within projects, view tasks, update task details, mark tasks as complete, and delete tasks.
- **Progress Tracking:** Track task completion within projects.
- **Pagination:** Retrieve projects and tasks in manageable pages through API query parameters.
- **Data Persistence:** Store users, projects, and tasks in PostgreSQL.
- **Ownership Protection:** Restrict access to projects and tasks based on the authenticated user.
- **Responsive Interface:** Navigate projects and tasks through a dashboard.


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
- Flask-CORS


**Database**
- PostgreSQL 16
- SQLAlchemy ORM
- Alembic database migrations


## Project Structure


```text
taskflow/
├── client/                 # React frontend
├── server/
│   ├── app.py              # Flask application
│   ├── models.py           # Database models
│   ├── routes/             # Authentication, project, and task APIs
│   ├── migrations/         # Database migration history
│   └── .env                # Local environment variables (not committed)
├── .gitignore
└── README.md
```


## Getting Started


### Prerequisites


Install the following:


- Node.js and npm
- Python 3
- PostgreSQL 16


### 1. Set Up PostgreSQL


On macOS, install and start PostgreSQL 16 using Homebrew:


```bash
brew install postgresql@16
brew services start postgresql@16
```


Create the TaskFlow database:


```bash
"$(brew --prefix)/opt/postgresql@16/bin/psql" postgres
```


At the PostgreSQL prompt, run:


```sql
CREATE DATABASE taskflow;
```


Then exit:


```sql
\q
```


If the database already exists, do not create it again.


### 2. Configure the Backend


From the project root, create and activate a Python virtual environment:


```bash
python3 -m venv .venv
source .venv/bin/activate
```


Install the backend dependencies:


```bash
pip install Flask Flask-SQLAlchemy Flask-Migrate Flask-CORS Flask-JWT-Extended python-dotenv "psycopg[binary]"
```


Create a `server/.env` file with the following configuration:


```dotenv
DATABASE_URL=postgresql+psycopg://localhost/taskflow
JWT_SECRET_KEY=replace-with-a-generated-secret
```


Generate a secure JWT secret:


```bash
python -c "import secrets; print(secrets.token_hex(32))"
```


Replace the placeholder with the generated secret. Keep it private, and never commit `.env` files or real credentials to GitHub.


The database URL assumes a local PostgreSQL setup using your macOS username as the database role. Adjust it if your PostgreSQL configuration differs.


### 3. Initialize the Database Schema


With the virtual environment activated and PostgreSQL running, execute:


```bash
flask --app server/app.py db upgrade
```


This applies the existing database migrations.


### 4. Start the Flask Backend


From the project root, run:


```bash
flask --app server/app.py run --port 5000
```


The API runs at:


`http://127.0.0.1:5000`


Verify that it is running by visiting:


`http://127.0.0.1:5000/api/health`


Keep this terminal open while using the application.


### 5. Start the React Frontend


Open a second terminal at the project root:


```bash
cd client
npm install
npm run dev
```


Open the local URL displayed by Vite, usually:


`http://localhost:5173`


Keep both the Flask backend and React frontend running while using TaskFlow.


## API Functionality


The Flask REST API supports:


- User registration and authentication
- Creating, listing, updating, and deleting projects
- Creating, listing, updating, and deleting tasks associated with projects
- Updating task completion status
- Pagination on project and task list endpoints
- Authenticated, ownership-based access to user resources


List endpoints support `page` and `per_page` query parameters. For example:


```text
/api/projects?page=1&per_page=10
/api/projects/1/tasks?page=1&per_page=10
```


Pagination information is returned through response headers.


## Application Goals


TaskFlow demonstrates full-stack application development by connecting a React interface to a Flask REST API, implementing authentication, managing related relational database resources, and supporting CRUD (Create, Read, Update, Delete) operations for projects and tasks.


## Future Improvements


- Add frontend pagination controls.
- Add task filtering and sorting by due date or completion status.
- Add project-level progress summaries.
- Expand automated frontend and backend testing.
- Improve accessibility and mobile layouts.
- Deploy the application for public access.



