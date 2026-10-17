
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import db, Project, User

projects_bp = Blueprint(
    "projects",
    __name__,
    url_prefix="/api/projects",
)


@projects_bp.get("")
@jwt_required()
def get_projects():
    user_id = int(get_jwt_identity())

    projects = db.session.execute(
        db.select(Project).filter_by(user_id=user_id)
    ).scalars().all()

    return jsonify([
        {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "status": project.status,
            "user_id": project.user_id,
        }
        for project in projects
    ]), 200


@projects_bp.post("")
@jwt_required()
def create_project():
    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    status = data.get("status", "active")

    if not title:
        return jsonify({"error": "Project title is required."}), 400

    if len(title) > 150:
        return jsonify({"error": "Title must be 150 characters or fewer."}), 400

    if status not in ["active", "completed", "on-hold"]:
        return jsonify({"error": "Invalid project status."}), 400

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if user is None:
        return jsonify({"error": "User not found."}), 404

    project = Project(
        title=title,
        description=description,
        status=status,
        user_id=user_id,
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({
        "message": "Project created successfully.",
        "project": {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "status": project.status,
            "user_id": project.user_id,
        },
    }), 201


@projects_bp.get("/<int:project_id>")
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())

    project = db.session.execute(
        db.select(Project).filter_by(
            id=project_id,
            user_id=user_id,
        )
    ).scalar_one_or_none()

    if project is None:
        return jsonify({"error": "Project not found."}), 404

    return jsonify({
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
    }), 200


@projects_bp.patch("/<int:project_id>")
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())

    project = db.session.execute(
        db.select(Project).filter_by(
            id=project_id,
            user_id=user_id,
        )
    ).scalar_one_or_none()

    if project is None:
        return jsonify({"error": "Project not found."}), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = data["title"]

        if not isinstance(title, str) or not title.strip():
            return jsonify({"error": "Project title cannot be empty."}), 400

        if len(title.strip()) > 150:
            return jsonify({"error": "Title must be 150 characters or fewer."}), 400

        project.title = title.strip()

    if "description" in data:
        if not isinstance(data["description"], str):
            return jsonify({"error": "Description must be text."}), 400
        project.description = data["description"].strip()

    if "status" in data:
        if data["status"] not in ["active", "completed", "on-hold"]:
            return jsonify({"error": "Invalid project status."}), 400
        project.status = data["status"]

    db.session.commit()

    return jsonify({
        "message": "Project updated successfully.",
        "project": {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "status": project.status,
            "user_id": project.user_id,
        },
    }), 200


@projects_bp.delete("/<int:project_id>")
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())

    project = db.session.execute(
        db.select(Project).filter_by(
            id=project_id,
            user_id=user_id,
        )
    ).scalar_one_or_none()

    if project is None:
        return jsonify({"error": "Project not found."}), 404

    db.session.delete(project)
    db.session.commit()

    return jsonify({"message": "Project deleted successfully."}), 200
