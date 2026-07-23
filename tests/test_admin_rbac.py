def test_ops_admin_session_has_only_ops_capabilities(admin_client):
    """An ops-scope admin gets ops capabilities only; admin_control/finance_ops
    (superadmin-gated actions) must never appear for them."""
    data = admin_client.get("/api/auth/session").get_json()["user"]
    assert data["role"] == "admin"
    assert set(data["capabilities"]) == {"lead_manage", "analytics_view", "task_ops", "export_data"}
    assert "admin_control" not in data["capabilities"]
    assert "finance_ops" not in data["capabilities"]


def test_superadmin_session_has_full_capabilities(superadmin_client):
    data = superadmin_client.get("/api/auth/session").get_json()["user"]
    assert "admin_control" in data["capabilities"]
    assert "finance_ops" in data["capabilities"]
    assert "lead_manage" in data["capabilities"]


def test_admins_list_hidden_from_ops_admin(admin_client):
    """The admin roster (other admins' emails/scopes) must not be returned to a
    non-superadmin admin, even on a direct hit to the endpoint."""
    resp = admin_client.get("/api/admin/admins")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["can_manage"] is False
    assert data["admins"] == []
    assert data["scopes"] == []


def test_admins_list_visible_to_superadmin(superadmin_client):
    resp = superadmin_client.get("/api/admin/admins")
    data = resp.get_json()
    assert data["can_manage"] is True
    assert data["scopes"] == ["ops", "finance", "support", "superadmin"]
    assert len(data["admins"]) >= 1
