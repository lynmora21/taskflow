
from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import db, Project, Task

tasks_bp = Blueprint(
    "tasks",
    __name__,
    url_prefix="/api",
)

@tasks_bp.get("/projects/<int:project_id>/tasks")
@jwt_required()
def get_tasks(project_id):
    user_id = int(get_jwt_identity())

    # Make sure this project belongs to the logged-in user
    project = db.session.execute(
        db.select(Project).filter_by(
            id=project_id,
            user_id=user_id,
        )
    ).scalar_one_or_none()

    if project is None:
        return jsonify({"error": "Project not found."}), 404

    # Get all tasks that belong to this project
    tasks = db.session.execute(
        db.select(Task).filter_by(project_id=project_id)
    ).scalars().all()

    return jsonify([
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": (
                task.due_date.isoformat()
                if task.due_date else None
            ),
            "completed": task.completed,
            "project_id": task.project_id,
        }
        for task in tasks
    ]), 200

@tasks_bp.post("/projects/<int:project_id>/tasks")
@jwt_required()
def create_task(project_id):
    user_id = int(get_jwt_identity())

    # Confirm that the project belongs to the logged-in user
    project = db.session.execute(
        db.select(Project).filter_by(
            id=project_id,
            user_id=user_id,
        )
    ).scalar_one_or_none()

    if project is None:
        return jsonify({"error": "Project not found."}), 404

    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    due_date_input = data.get("due_date")

    if not title:
        return jsonify({"error": "Task title is required."}), 400

    if len(title) > 150:
        return jsonify({
            "error": "Task title must be 150 characters or fewer."
        }), 400

    if due_date_input:
        try:
            due_date_value = date.fromisoformat(due_date_input)
        except (ValueError, TypeError):
            return jsonify({
                "error": "Due date must use YYYY-MM-DD format."
            }), 400
    else:
        due_date_value = None

    task = Task(
        title=title,
        description=description,
        due_date=due_date_value,
        project_id=project.id,
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        "message": "Task created successfully.",
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": (
                task.due_date.isoformat()
                if task.due_date else None
            ),
            "completed": task.completed,
            "project_id": task.project_id,
        },
    }), 201

@tasks_bp.patch("/tasks/<int:task_id>")
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())

    # Find the task only if its project belongs to this user
    task = db.session.execute(
        db.select(Task)
        .join(Project)
        .filter(
            Task.id == task_id,
            Project.user_id == user_id,
        )
    ).scalar_one_or_none()

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = data["title"]

        if not isinstance(title, str) or not title.strip():
            return jsonify({"error": "Task title cannot be empty."}), 400

        if len(title.strip()) > 150:
            return jsonify({
                "error": "Task title must be 150 characters or fewer."
            }), 400

        task.title = title.strip()

    if "description" in data:
        if not isinstance(data["description"], str):
            return jsonify({"error": "Description must be text."}), 400

        task.description = data["description"].strip()

    if "due_date" in data:
        due_date_input = data["due_date"]

        if due_date_input is None or due_date_input == "":
            task.due_date = None
        else:
            try:
                task.due_date = date.fromisoformat(due_date_input)
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Due date must use YYYY-MM-DD format."
                }), 400

    if "completed" in data:
        if not isinstance(data["completed"], bool):
            return jsonify({
                "error": "Completed must be true or false."
            }), 400

        task.completed = data["completed"]

    db.session.commit()

    return jsonify({
        "message": "Task updated successfully.",
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": (
                task.due_date.isoformat()
                if task.due_date else None
            ),
            "completed": task.completed,
            "project_id": task.project_id,
        },
    }), 200

@tasks_bp.delete("/tasks/<int:task_id>")
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())

    # Find the task only if its project belongs to this user
    task = db.session.execute(
        db.select(Task)
        .join(Project)
        .filter(
            Task.id == task_id,
            Project.user_id == user_id,
        )
    ).scalar_one_or_none()

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        "message": "Task deleted successfully."
    }), 200
