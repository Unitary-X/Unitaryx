import os
import tempfile

import pytest

_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_db_path}")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from backend.app import app as flask_app, db, Founder, Project  # noqa: E402  (must import after env vars are set)


@pytest.fixture(autouse=True)
def _clean_founders_and_projects():
    with flask_app.app_context():
        Founder.query.delete()
        Project.query.delete()
        db.session.commit()
    yield


@pytest.fixture
def client():
    flask_app.config["TESTING"] = False  # keep real CSRF validation active in tests
    return flask_app.test_client()


@pytest.fixture
def admin_client(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 1
        sess["role"] = "admin"
    token = client.get("/api/csrf-token").get_json()["token"]
    client.csrf_headers = {"X-CSRFToken": token}
    return client
