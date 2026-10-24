
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from models import db
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.tasks import tasks_bp


# Load environment variables from server/.env
load_dotenv(
    os.path.join(os.path.dirname(__file__), ".env")
)

app = Flask(__name__)

# Create the instance directory for the SQLite fallback database
os.makedirs(app.instance_path, exist_ok=True)

# Database configuration
database_url = os.getenv("DATABASE_URL")

if database_url:
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "sqlite:///"
        + os.path.join(app.instance_path, "taskflow.db")
    )

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

if not app.config["JWT_SECRET_KEY"]:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing. Check server/.env."
    )

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db, directory=os.path.join(
    os.path.dirname(__file__), "migrations"
))
jwt = JWTManager(app)


# Allow the React frontend to communicate with Flask
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    supports_credentials=True,
)


# Register authentication endpoints
app.register_blueprint(auth_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(tasks_bp)


# Health check endpoint
@app.get("/api/health")
def health_check():
    return jsonify({
        "status": "success",
        "message": "TaskFlow API is running!",
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
