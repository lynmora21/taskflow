
import sys
from pathlib import Path

import pytest

# Add the server directory so tests can import the Flask app and models.
SERVER_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVER_DIR))

from app import app as flask_app
from models import db

@pytest.fixture
def app():
    """Create a fresh app using an isolated in-memory database."""
    flask_app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        JWT_SECRET_KEY="taskflow-test-secret-key-for-pytest-only-2026" ,
    )

    with flask_app.app_context():
        db.drop_all()
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def user_token(client):
    """Register a user and return their access token."""
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    return response.get_json()["access_token"]


@pytest.fixture
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


def register_user(client, name, email):
    return client.post(
        "/api/auth/register",
        json={
            "name": name,
            "email": email,
            "password": "password123",
        },
    )


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "success"


def test_register_and_login(client):
    response = register_user(client, "Alex", "alex@example.com")
    assert response.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={
            "email": "alex@example.com",
            "password": "password123",
        },
    )
    assert login.status_code == 200
    assert "access_token" in login.get_json()


def test_registration_rejects_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Alex",
            "email": "alex@example.com",
            "password": "short",
        },
    )
    assert response.status_code == 400


def test_login_rejects_wrong_password(client):
    register_user(client, "Alex", "alex@example.com")

    response = client.post(
        "/api/auth/login",
        json={
            "email": "alex@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


def test_projects_require_authentication(client):
    response = client.get("/api/projects")
    assert response.status_code == 401


def test_create_update_and_delete_project(client, auth_headers):
    created = client.post(
        "/api/projects",
        headers=auth_headers,
        json={
            "title": "Test Project",
            "description": "A project for testing",
            "status": "active",
        },
    )
    assert created.status_code == 201
    project_id = created.get_json()["project"]["id"]

    updated = client.patch(
        f"/api/projects/{project_id}",
        headers=auth_headers,
        json={"title": "Updated Project", "status": "completed"},
    )
    assert updated.status_code == 200
    assert updated.get_json()["project"]["title"] == "Updated Project"

    deleted = client.delete(
        f"/api/projects/{project_id}",
        headers=auth_headers,
    )
    assert deleted.status_code == 200


def test_project_pagination_headers(client, auth_headers):
    for title in ("Project One", "Project Two"):
        response = client.post(
            "/api/projects",
            headers=auth_headers,
            json={"title": title},
        )
        assert response.status_code == 201

    response = client.get(
        "/api/projects?page=1&per_page=1",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.get_json()) == 1
    assert response.headers["X-Total-Count"] == "2"
    assert response.headers["X-Total-Pages"] == "2"


def test_user_cannot_access_another_users_project(client, auth_headers):
    project_response = client.post(
        "/api/projects",
        headers=auth_headers,
        json={"title": "Private Project"},
    )
    project_id = project_response.get_json()["project"]["id"]

    second_user = register_user(
        client, "Another User", "another@example.com"
    )
    second_token = second_user.get_json()["access_token"]
    second_headers = {"Authorization": f"Bearer {second_token}"}

    response = client.get(
        f"/api/projects/{project_id}",
        headers=second_headers,
    )
    assert response.status_code == 404


def test_create_update_and_delete_task(client, auth_headers):
    project_response = client.post(
        "/api/projects",
        headers=auth_headers,
        json={"title": "Task Parent Project"},
    )
    project_id = project_response.get_json()["project"]["id"]

    created = client.post(
        f"/api/projects/{project_id}/tasks",
        headers=auth_headers,
        json={
            "title": "Test Task",
            "description": "Testing task operations",
            "due_date": "2026-12-01",
        },
    )
    assert created.status_code == 201
    task_id = created.get_json()["task"]["id"]

    updated = client.patch(
        f"/api/tasks/{task_id}",
        headers=auth_headers,
        json={"completed": True},
    )
    assert updated.status_code == 200
    assert updated.get_json()["task"]["completed"] is True

    deleted = client.delete(
        f"/api/tasks/{task_id}",
        headers=auth_headers,
    )
    assert deleted.status_code == 200


def test_user_cannot_access_another_users_tasks(client, auth_headers):
    project_response = client.post(
        "/api/projects",
        headers=auth_headers,
        json={"title": "Private Task Project"},
    )
    project_id = project_response.get_json()["project"]["id"]

    task_response = client.post(
        f"/api/projects/{project_id}/tasks",
        headers=auth_headers,
        json={"title": "Private Task"},
    )
    task_id = task_response.get_json()["task"]["id"]

    second_user = register_user(
        client, "Another User", "another@example.com"
    )
    second_headers = {
        "Authorization": f"Bearer {second_user.get_json()['access_token']}"
    }

    response = client.patch(
        f"/api/tasks/{task_id}",
        headers=second_headers,
        json={"completed": True},
    )
    assert response.status_code == 404
