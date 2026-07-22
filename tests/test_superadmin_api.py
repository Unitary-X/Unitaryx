"""Phase 6: leads, admin-management, sessions, backups + admin.html retirement.

The most sensitive surface — every write is capability-gated and CSRF-protected,
and the non-superadmin approval-queue behaviour is preserved from the classic
form routes.
"""
import pytest

from backend.app import app as flask_app, db, User, ProjectRequest, ApprovalTicket, UserSession
from werkzeug.security import generate_password_hash


def _make_request(**overrides):
    fields = dict(
        name="Lead One", email="lead@example.com", service="web",
        message="Please build a store for us", status="New", priority="Medium", value=1000,
    )
    fields.update(overrides)
    with flask_app.app_context():
        r = ProjectRequest(**fields)
        db.session.add(r)
        db.session.commit()
        return r.id


# ── admin.html retirement ─────────────────────────────────────────────────────

def test_admin_redirects_to_studio(admin_client):
    resp = admin_client.get("/admin")
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/admin/studio")


def test_admin_html_template_is_gone():
    import os
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assert not os.path.exists(os.path.join(here, "frontend", "templates", "admin.html"))


# ── leads ─────────────────────────────────────────────────────────────────────

def test_leads_require_lead_manage(client):
    # The 'finance' scope has finance_ops but NOT lead_manage (support/ops both do),
    # so it's the right scope to prove the lead_manage gate on the leads API.
    with flask_app.app_context():
        u = User(name="Fin", email="finonly2@example.com", password="x", role="admin", admin_scope="finance")
        db.session.add(u)
        db.session.commit()
        uid = u.id
    with client.session_transaction() as sess:
        sess["user_id"] = uid
        sess["role"] = "admin"
    assert client.get("/api/admin/leads").status_code == 403


def test_leads_list_exposes_admin_fields(admin_client):
    _make_request(internal_notes="secret", value=1234)
    body = admin_client.get("/api/admin/leads").get_json()
    lead = body["leads"][0]
    # This IS the admin view — scoring + internal notes SHOULD be present here.
    for k in ("internal_notes", "lead_score_total", "lead_tier", "escalation_level"):
        assert k in lead
    assert body["summary"]["total"] == 1


def test_lead_update_requires_csrf(admin_client):
    rid = _make_request()
    assert admin_client.put(f"/api/admin/leads/{rid}", json={"status": "In Progress"}).status_code == 403


def test_superadmin_lead_update_applies_directly(superadmin_client):
    rid = _make_request()
    resp = superadmin_client.put(
        f"/api/admin/leads/{rid}",
        json={"status": "Done", "priority": "High", "value": 50000, "internal_notes": "closed won"},
        headers=superadmin_client.csrf_headers,
    )
    assert resp.status_code == 200
    lead = resp.get_json()["lead"]
    assert lead["status"] == "Done"
    assert lead["internal_notes"] == "closed won"


def test_ops_sensitive_lead_update_queues_approval(client):
    """A non-superadmin ops admin marking a lead Done must be queued, not applied."""
    rid = _make_request()
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # ops admin
        sess["role"] = "admin"
    token = client.get("/api/csrf-token").get_json()["token"]
    resp = client.put(
        f"/api/admin/leads/{rid}",
        json={"status": "Done", "priority": "Medium", "value": 1000},
        headers={"X-CSRFToken": token},
    )
    assert resp.status_code == 200
    assert resp.get_json()["queued"] is True
    with flask_app.app_context():
        assert ApprovalTicket.query.filter_by(action_key="project_update").count() == 1
        # the lead itself is unchanged
        assert db.session.get(ProjectRequest, rid).status == "New"


def test_superadmin_lead_delete(superadmin_client):
    rid = _make_request()
    resp = superadmin_client.delete(f"/api/admin/leads/{rid}", headers=superadmin_client.csrf_headers)
    assert resp.status_code == 200
    with flask_app.app_context():
        assert db.session.get(ProjectRequest, rid) is None


def test_ops_lead_delete_queues_approval(client):
    rid = _make_request()
    with client.session_transaction() as sess:
        sess["user_id"] = 1
        sess["role"] = "admin"
    token = client.get("/api/csrf-token").get_json()["token"]
    resp = client.delete(f"/api/admin/leads/{rid}", headers={"X-CSRFToken": token})
    assert resp.get_json()["queued"] is True
    with flask_app.app_context():
        assert db.session.get(ProjectRequest, rid) is not None  # not deleted


def test_bulk_action_superadmin(superadmin_client):
    ids = [_make_request(email=f"b{i}@example.com") for i in range(3)]
    resp = superadmin_client.post(
        "/api/admin/leads/bulk",
        json={"action": "mark_done", "ids": ids},
        headers=superadmin_client.csrf_headers,
    )
    assert resp.status_code == 200
    assert resp.get_json()["count"] == 3
    with flask_app.app_context():
        assert all(db.session.get(ProjectRequest, i).status == "Done" for i in ids)


# ── admin management ──────────────────────────────────────────────────────────

def test_admins_list_hides_manage_for_ops(admin_client):
    body = admin_client.get("/api/admin/admins").get_json()
    assert body["can_manage"] is False


def test_only_superadmin_creates_admins(admin_client):
    resp = admin_client.post(
        "/api/admin/admins",
        json={"name": "New Admin", "email": "new@example.com", "password": "secret123", "admin_scope": "ops"},
        headers=admin_client.csrf_headers,
    )
    assert resp.status_code == 403


def test_superadmin_admin_lifecycle(superadmin_client):
    created = superadmin_client.post(
        "/api/admin/admins",
        json={"name": "Fin Admin", "email": "finadmin@example.com", "password": "secret123", "admin_scope": "finance"},
        headers=superadmin_client.csrf_headers,
    )
    assert created.status_code == 201
    aid = created.get_json()["admin"]["id"]

    updated = superadmin_client.put(
        f"/api/admin/admins/{aid}",
        json={"admin_scope": "ops", "is_active": False},
        headers=superadmin_client.csrf_headers,
    )
    assert updated.status_code == 200
    assert updated.get_json()["admin"]["admin_scope"] == "ops"
    assert updated.get_json()["admin"]["is_active"] is False

    reset = superadmin_client.post(
        f"/api/admin/admins/{aid}/reset-password", json={}, headers=superadmin_client.csrf_headers
    )
    assert reset.status_code == 200
    assert len(reset.get_json()["temporary_password"]) >= 8

    gone = superadmin_client.delete(f"/api/admin/admins/{aid}", headers=superadmin_client.csrf_headers)
    assert gone.status_code == 200


def test_cannot_delete_superadmin(superadmin_client):
    admins = superadmin_client.get("/api/admin/admins").get_json()["admins"]
    sup = next(a for a in admins if a["is_super"])
    resp = superadmin_client.delete(f"/api/admin/admins/{sup['id']}", headers=superadmin_client.csrf_headers)
    assert resp.status_code == 400


def test_admin_create_rejects_duplicate_email(superadmin_client):
    resp = superadmin_client.post(
        "/api/admin/admins",
        json={"name": "Dup", "email": "admin@unitaryx.com", "password": "secret123"},
        headers=superadmin_client.csrf_headers,
    )
    assert resp.status_code == 409


# ── sessions ──────────────────────────────────────────────────────────────────

def test_sessions_list_and_revoke(superadmin_client):
    with flask_app.app_context():
        s = UserSession(user_id=1, session_token="tok-123", ip_address="1.2.3.4",
                        user_agent="pytest", is_active=True)
        db.session.add(s)
        db.session.commit()
        sid = s.id

    listing = superadmin_client.get("/api/admin/sessions").get_json()
    assert any(row["id"] == sid for row in listing["sessions"])

    resp = superadmin_client.post(f"/api/admin/sessions/{sid}/revoke", headers=superadmin_client.csrf_headers)
    assert resp.status_code == 200
    with flask_app.app_context():
        assert db.session.get(UserSession, sid).is_active is False


# ── backups ───────────────────────────────────────────────────────────────────

def test_backups_require_admin_control(admin_client):
    assert admin_client.get("/api/admin/db-backups").status_code == 403


def test_backup_create_list_and_restore(superadmin_client):
    _make_request(email="beforebackup@example.com")
    created = superadmin_client.post("/api/admin/db-backups", json={}, headers=superadmin_client.csrf_headers)
    assert created.status_code == 201
    fname = created.get_json()["filename"]

    listing = superadmin_client.get("/api/admin/db-backups").get_json()
    assert any(b["filename"] == fname for b in listing["backups"])

    # restore requires exact confirmation
    bad = superadmin_client.post(
        "/api/admin/db-backups/restore",
        json={"backup_file": fname, "confirm_restore": "yes"},
        headers=superadmin_client.csrf_headers,
    )
    assert bad.status_code == 400

    ok = superadmin_client.post(
        "/api/admin/db-backups/restore",
        json={"backup_file": fname, "confirm_restore": "RESTORE"},
        headers=superadmin_client.csrf_headers,
    )
    assert ok.status_code == 200


def test_backup_restore_rejects_path_traversal(superadmin_client):
    resp = superadmin_client.post(
        "/api/admin/db-backups/restore",
        json={"backup_file": "../../etc/passwd", "confirm_restore": "RESTORE"},
        headers=superadmin_client.csrf_headers,
    )
    assert resp.status_code in (400, 404)
