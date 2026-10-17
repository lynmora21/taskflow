
import { useEffect, useState } from "react";
import "./App.css";
import { apiRequest } from "./api/api";

function App() {
  // Restore the logged-in user when the page refreshes.
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // Authentication state.
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Project state.
  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("active");
  const [projectFormError, setProjectFormError] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  // Track which project is being edited.
  const [editingProject, setEditingProject] = useState(null);
  const [savingProjectChanges, setSavingProjectChanges] =
    useState(false);

  // Selected project and task state.
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskError, setTaskError] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);

  // New task form state.
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskFormError, setTaskFormError] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  // Load projects when a user is authenticated.
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    async function loadProjects() {
      try {
        setProjectError("");

        const data = await apiRequest("/projects");

        setProjects(
          Array.isArray(data) ? data : data.projects ?? []
        );
      } catch (err) {
        setProjectError(err.message);
      }
    }

    loadProjects();
  }, [user]);

  // Switch between login and registration.
  function switchAuthMode(mode) {
    setAuthMode(mode);
    setAuthError("");
    setName("");
    setEmail("");
    setPassword("");
  }

  // Register a new user or log in an existing user.
  async function handleAuthSubmit(event) {
    event.preventDefault();

    setAuthError("");
    setLoading(true);

    const endpoint =
      authMode === "register" ? "/auth/register" : "/auth/login";

    const payload =
      authMode === "register"
        ? {
            name: name.trim(),
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

    try {
      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setPassword("");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reset the project form and exit edit mode.
  function cancelProjectForm() {
    setShowProjectForm(false);
    setEditingProject(null);
    setProjectTitle("");
    setProjectDescription("");
    setProjectStatus("active");
    setProjectFormError("");
  }

  // Open a blank form to create a new project.
  function startCreatingProject() {
    setEditingProject(null);
    setProjectTitle("");
    setProjectDescription("");
    setProjectStatus("active");
    setProjectFormError("");
    setProjectError("");
    setShowProjectForm(true);
  }

  // Create a project through the Flask API.
  async function handleCreateProject(event) {
    event.preventDefault();

    setProjectFormError("");
    setSavingProject(true);

    try {
      const data = await apiRequest("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: projectTitle.trim(),
          description: projectDescription.trim(),
          status: projectStatus,
        }),
      });

      const newProject = data.project ?? data;

      setProjects((currentProjects) => [
        ...currentProjects,
        newProject,
      ]);

      cancelProjectForm();
    } catch (err) {
      setProjectFormError(err.message);
    } finally {
      setSavingProject(false);
    }
  }

  // Load an existing project's details into the form.
  function startEditingProject(project) {
    setEditingProject(project);
    setProjectTitle(project.title);
    setProjectDescription(project.description || "");
    setProjectStatus(project.status);
    setProjectFormError("");
    setProjectError("");
    setShowProjectForm(true);
  }

  // Save changes to an existing project.
  async function handleUpdateProject(event) {
    event.preventDefault();

    if (!editingProject) {
      return;
    }

    setProjectFormError("");
    setSavingProjectChanges(true);

    try {
      const data = await apiRequest(
        `/projects/${editingProject.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: projectTitle.trim(),
            description: projectDescription.trim(),
            status: projectStatus,
          }),
        }
      );

      const updatedProject = data.project ?? data;

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === editingProject.id
            ? updatedProject
            : project
        )
      );

      // Keep the selected workspace in sync with the updated project.
      setSelectedProject((currentProject) =>
        currentProject?.id === editingProject.id
          ? updatedProject
          : currentProject
      );

      cancelProjectForm();
    } catch (err) {
      setProjectFormError(err.message);
    } finally {
      setSavingProjectChanges(false);
    }
  }

  // Delete a project through the Flask API.
  async function handleDeleteProject(project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setProjectError("");

    try {
      await apiRequest(`/projects/${project.id}`, {
        method: "DELETE",
      });

      setProjects((currentProjects) =>
        currentProjects.filter(
          (currentProject) => currentProject.id !== project.id
        )
      );

      // Close the workspace if the deleted project was open.
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        setTasks([]);
        setTaskError("");
        setTaskFormError("");
        setShowTaskForm(false);
        setLoadingTasks(false);
      }

      // Close the form if it was editing the deleted project.
      if (editingProject?.id === project.id) {
        cancelProjectForm();
      }
    } catch (err) {
      setProjectError(err.message);
    }
  }

  // Load tasks when a project card is selected.
  async function handleOpenProject(project) {
    setSelectedProject(project);
    setTasks([]);
    setTaskError("");
    setTaskFormError("");
    setShowTaskForm(false);
    setLoadingTasks(true);

    try {
      const data = await apiRequest(
        `/projects/${project.id}/tasks`
      );

      setTasks(
        Array.isArray(data) ? data : data.tasks ?? []
      );
    } catch (err) {
      setTaskError(err.message);
    } finally {
      setLoadingTasks(false);
    }
  }

  // Create a task for the currently selected project.
  async function handleCreateTask(event) {
    event.preventDefault();

    if (!selectedProject) {
      return;
    }

    setTaskFormError("");
    setSavingTask(true);

    try {
      const data = await apiRequest(
        `/projects/${selectedProject.id}/tasks`,
        {
          method: "POST",
          body: JSON.stringify({
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            due_date: taskDueDate || null,
            completed: false,
          }),
        }
      );

      const newTask = data.task ?? data;

      setTasks((currentTasks) => [
        ...currentTasks,
        newTask,
      ]);

      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setShowTaskForm(false);
    } catch (err) {
      setTaskFormError(err.message);
    } finally {
      setSavingTask(false);
    }
  }

  // Toggle a task between in progress and completed.
  async function handleToggleTask(task) {
    setTaskError("");

    const updatedCompleted = !task.completed;

    // Update the screen immediately.
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              completed: updatedCompleted,
            }
          : currentTask
      )
    );

    try {
      const data = await apiRequest(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          completed: updatedCompleted,
        }),
      });

      const updatedTask = data.task ?? data;

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? updatedTask
            : currentTask
        )
      );
    } catch (err) {
      // Restore the original status if saving fails.
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                completed: task.completed,
              }
            : currentTask
        )
      );

      setTaskError(err.message);
    }
  }

  // Delete a task through the Flask API.
  async function handleDeleteTask(task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setTaskError("");

    try {
      await apiRequest(`/tasks/${task.id}`, {
        method: "DELETE",
      });

      setTasks((currentTasks) =>
        currentTasks.filter(
          (currentTask) => currentTask.id !== task.id
        )
      );
    } catch (err) {
      setTaskError(err.message);
    }
  }

  // Return to the project overview.
  function handleBackToProjects() {
    setSelectedProject(null);
    setTasks([]);
    setTaskError("");
    setTaskFormError("");
    setShowTaskForm(false);
    setLoadingTasks(false);
  }

  // Log out and clear the local session.
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setProjects([]);
    setProjectError("");
    setProjectFormError("");
    setEditingProject(null);
    setSelectedProject(null);
    setTasks([]);
    setTaskError("");
    setTaskFormError("");
    setShowProjectForm(false);
    setShowTaskForm(false);
    setName("");
    setEmail("");
    setPassword("");
    setAuthError("");
    setAuthMode("login");
  }

  // Login and registration screen.
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <span className="brand-icon">T</span>
          <h1>TaskFlow</h1>
        </div>

        <main className="auth-card">
          <p className="eyebrow">
            {authMode === "login"
              ? "WELCOME BACK"
              : "GET STARTED"}
          </p>

          <h2>
            {authMode === "login"
              ? "Sign in to TaskFlow"
              : "Create your account"}
          </h2>

          <p className="auth-description">
            {authMode === "login"
              ? "Organize your projects and pick up where you left off."
              : "Create an account to start organizing your work."}
          </p>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === "register" && (
              <label>
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                maxLength={120}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  authMode === "register"
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                minLength={authMode === "register" ? 8 : undefined}
                autoComplete={
                  authMode === "register"
                    ? "new-password"
                    : "current-password"
                }
                required
              />
            </label>

            {authError && (
              <p className="form-error" role="alert">
                {authError}
              </p>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : authMode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              className="text-button"
              type="button"
              onClick={() =>
                switchAuthMode(
                  authMode === "login" ? "register" : "login"
                )
              }
            >
              {authMode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </main>

        <p className="auth-footer">
          Plan your work. Track your progress. Keep moving forward.
        </p>
      </div>
    );
  }

  // Authenticated dashboard.
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">T</span>
          <h1>TaskFlow</h1>
        </div>

        <div className="header-actions">
          <p className="header-subtitle">
            Welcome, {user.name}!
          </p>

          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h2>Make progress, one task at a time.</h2>
            <p className="welcome-description">
              Organize your projects, manage your tasks, and keep
              moving forward.
            </p>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <p>Total Projects</p>
            <h3>{projects.length}</h3>
          </article>

          <article className="stat-card">
            <p>Total Tasks</p>
            <h3>{tasks.length}</h3>
          </article>

          <article className="stat-card">
            <p>Completed Tasks</p>
            <h3>
              {tasks.filter((task) => task.completed).length}
            </h3>
          </article>
        </section>

        {/* Project overview and creation/editing form */}
        <section className="projects-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">OVERVIEW</p>
              <h2>Your Projects</h2>
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={() => {
                if (showProjectForm) {
                  cancelProjectForm();
                } else {
                  startCreatingProject();
                }
              }}
            >
              {showProjectForm ? "Cancel" : "+ New Project"}
            </button>
          </div>

          {showProjectForm && (
            <form
              className="project-form"
              onSubmit={
                editingProject
                  ? handleUpdateProject
                  : handleCreateProject
              }
            >
              <h3>
                {editingProject
                  ? "Edit project"
                  : "Create a new project"}
              </h3>

              <label>
                Project title
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(event) =>
                    setProjectTitle(event.target.value)
                  }
                  placeholder="e.g. Personal goals"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  placeholder="What do you want to accomplish?"
                  rows={3}
                />
              </label>

              <label>
                Status
                <select
                  value={projectStatus}
                  onChange={(event) =>
                    setProjectStatus(event.target.value)
                  }
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On hold</option>
                </select>
              </label>

              {projectFormError && (
                <p className="form-error" role="alert">
                  {projectFormError}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={savingProject || savingProjectChanges}
              >
                {editingProject
                  ? savingProjectChanges
                    ? "Saving Changes..."
                    : "Save Changes"
                  : savingProject
                    ? "Creating..."
                    : "Create Project"}
              </button>

              {editingProject && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={cancelProjectForm}
                >
                  Cancel Editing
                </button>
              )}
            </form>
          )}

          {projectError && (
            <p className="form-error" role="alert">
              {projectError}
            </p>
          )}

          {!projectError && projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h3>No projects yet</h3>
              <p>
                Your projects will appear here when you create them.
              </p>
            </div>
          ) : (
            !projectError && (
              <div className="project-grid">
                {projects.map((project) => (
                  <article
                    className="project-card clickable-project"
                    key={project.id}
                  >
                    <button
                      type="button"
                      className="project-card-button"
                      onClick={() => handleOpenProject(project)}
                      aria-label={`Open project ${project.title}`}
                    >
                      <span
                        className={`project-status ${project.status}`}
                      >
                        {project.status}
                      </span>

                      <h3>{project.title}</h3>

                      <p>
                        {project.description ||
                          "No description provided."}
                      </p>

                      <span className="open-project-label">
                        View tasks →
                      </span>
                    </button>

                    <div className="project-card-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => startEditingProject(project)}
                        aria-label={`Edit project ${project.title}`}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-task-button"
                        onClick={() => handleDeleteProject(project)}
                        aria-label={`Delete project ${project.title}`}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </section>

        {/* Task workspace for the selected project */}
        {selectedProject && (
          <section className="tasks-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PROJECT WORKSPACE</p>
                <h2>{selectedProject.title}</h2>
                <p className="welcome-description">
                  {selectedProject.description ||
                    "Tasks for this project"}
                </p>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={handleBackToProjects}
              >
                Back to Projects
              </button>
            </div>

            <div className="task-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setShowTaskForm((current) => !current);
                  setTaskFormError("");
                }}
              >
                {showTaskForm ? "Cancel" : "+ Add Task"}
              </button>
            </div>

            {/* New task form */}
            {showTaskForm && (
              <form
                className="project-form task-form"
                onSubmit={handleCreateTask}
              >
                <h3>Create a new task</h3>

                <label>
                  Task title
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(event) =>
                      setTaskTitle(event.target.value)
                    }
                    placeholder="e.g. Finish project proposal"
                    maxLength={150}
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={taskDescription}
                    onChange={(event) =>
                      setTaskDescription(event.target.value)
                    }
                    placeholder="What needs to get done?"
                    rows={3}
                  />
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(event) =>
                      setTaskDueDate(event.target.value)
                    }
                  />
                </label>

                {taskFormError && (
                  <p className="form-error" role="alert">
                    {taskFormError}
                  </p>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={savingTask}
                >
                  {savingTask ? "Saving Task..." : "Create Task"}
                </button>
              </form>
            )}

            {loadingTasks && <p>Loading tasks...</p>}

            {taskError && (
              <p className="form-error" role="alert">
                {taskError}
              </p>
            )}

            {!loadingTasks && !taskError && tasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✦</div>
                <h3>No tasks yet</h3>
                <p>
                  This project is ready for its first task.
                </p>
              </div>
            )}

            {!loadingTasks && !taskError && tasks.length > 0 && (
              <div className="task-list">
                {tasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div className="task-card-content">
                      <label className="task-completion">
                        <input
                          type="checkbox"
                          checked={Boolean(task.completed)}
                          onChange={() => handleToggleTask(task)}
                          aria-label={`Mark ${task.title} ${
                            task.completed
                              ? "in progress"
                              : "completed"
                          }`}
                        />

                        <span className="task-title">
                          {task.title}
                        </span>
                      </label>

                      <p>
                        {task.description ||
                          "No description provided."}
                      </p>

                      {task.due_date && (
                        <span className="task-due-date">
                          Due {task.due_date}
                        </span>
                      )}
                    </div>

                    <div className="task-card-actions">
                      <span
                        className={`task-status ${
                          task.completed ? "completed" : "pending"
                        }`}
                      >
                        {task.completed
                          ? "Completed"
                          : "In progress"}
                      </span>

                      <button
                        type="button"
                        className="delete-task-button"
                        onClick={() => handleDeleteTask(task)}
                        aria-label={`Delete task ${task.title}`}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
