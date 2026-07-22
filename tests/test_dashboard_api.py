from datetime import datetime, timedelta

import pytest

from backend.app import app as flask_app, db, User, ProjectRequest
from werkzeug.security import generate_password_hash


def _make_customer(email="cust@example.com", name="Asha Rao"):
    with flask_app.app_context():
        user = User(name=name, email=email, password=generate_password_hash("x"), role="user")
        db.session.add(user)
        db.session.commit()
        return user.id


def _add_request(user_id, email="cust@example.com", **overrides):
    fields = dict(
        user_id=user_id,
        name="Asha Rao",
        email=email,
        service="web",
        message="Build me a store",
        status="In Progress",
        priority="High",
        value=1500,
        deadline="6 weeks",
        is_new_update=False,
        created_at=datetime.utcnow(),
    )
    fields.update(overrides)
    with flask_app.app_context():
        req = ProjectRequest(**fields)
        db.session.add(req)
        db.session.commit()
        return req.id


@pytest.fixture
def customer_client(client):
    uid = _make_customer()
    with client.session_transaction() as sess:
        sess["user_id"] = uid
        sess["role"] = "user"
    client.customer_id = uid
    return client


def test_requires_authentication(client):
    resp = client.get("/api/dashboard/requests")
    assert resp.status_code == 401


def test_never_leaks_admin_only_fields(customer_client):
    _add_request(
        customer_client.customer_id,
        internal_notes="SECRET admin note",
        lead_score_total=88,
        lead_score_value=40,
        lead_tier="A",
        escalation_level=2,
    )
    body = customer_client.get("/api/dashboard/requests").get_json()
    req = body["requests"][0]
    forbidden = {
        "internal_notes",
        "lead_score_total",
        "lead_score_value",
        "lead_score_urgency",
        "lead_score_conversion",
        "lead_tier",
        "escalation_level",
        "stale_flag",
        "last_followup_at",
        "next_followup_at",
    }
    assert forbidden.isdisjoint(req.keys())
    assert set(req.keys()) == {
        "id",
        "service",
        "message",
        "status",
        "priority",
        "value",
        "deadline",
        "created_at",
        "is_updated",
    }


def test_only_returns_own_requests(customer_client):
    _add_request(customer_client.customer_id)
    # a different customer's request must not appear
    other_id = _make_customer(email="other@example.com", name="Other Person")
    _add_request(other_id, email="other@example.com", message="Not mine")
    body = customer_client.get("/api/dashboard/requests").get_json()
    messages = [r["message"] for r in body["requests"]]
    assert "Build me a store" in messages
    assert "Not mine" not in messages


def test_update_flag_is_one_shot(customer_client):
    _add_request(customer_client.customer_id, is_new_update=True)
    first = customer_client.get("/api/dashboard/requests").get_json()
    assert first["requests"][0]["is_updated"] is True
    second = customer_client.get("/api/dashboard/requests").get_json()
    assert second["requests"][0]["is_updated"] is False


def test_returns_first_name(customer_client):
    body = customer_client.get("/api/dashboard/requests").get_json()
    assert body["user"]["first_name"] == "Asha"


def test_dashboard_route_serves_spa_shell_when_authed(customer_client):
    resp = customer_client.get("/dashboard")
    assert resp.status_code == 200
    assert b'id="root"' in resp.data
