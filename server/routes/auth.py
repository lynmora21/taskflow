
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from werkzeug.security import (
    generate_password_hash,
    check_password_hash,
)

from models import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email, and password are required."
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must be at least 8 characters."
        }), 400

    if len(name) > 100 or len(email) > 120:
        return jsonify({
            "error": "Name or email is too long."
        }), 400

    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return jsonify({
            "error": "Please enter a valid email address."
        }), 400

    existing_user = db.session.execute(
        db.select(User).filter_by(email=email)
    ).scalar_one_or_none()

    if existing_user:
        return jsonify({
            "error": "An account with this email already exists."
        }), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
    )

    try:
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({
            "message": "Account created successfully.",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            },
        }), 201

    except Exception:
        db.session.rollback()
        auth_bp.logger.exception("Registration failed")
        return jsonify({
            "error": "Unable to create your account right now."
        }), 500


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required."
        }), 400

    user = db.session.execute(
        db.select(User).filter_by(email=email)
    ).scalar_one_or_none()

    if user is None or not check_password_hash(
        user.password_hash, password
    ):
        return jsonify({
            "error": "Invalid email or password."
        }), 401

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "Login successful.",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }), 200
