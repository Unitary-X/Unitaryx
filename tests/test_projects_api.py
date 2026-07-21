def test_public_list_ordered_by_display_order(admin_client):
    headers = admin_client.csrf_headers
    admin_client.post(
        "/api/admin/projects",
        json={"title": "Second", "description": "d", "category": "web", "display_order": 2},
        headers=headers,
    )
    admin_client.post(
        "/api/admin/projects",
        json={"title": "First", "description": "d", "category": "web", "display_order": 1},
        headers=headers,
    )

    resp = admin_client.get("/api/projects")
    assert resp.status_code == 200
    titles = [p["title"] for p in resp.get_json()]
    assert titles.index("First") < titles.index("Second")


def test_category_filter_still_works(admin_client):
    headers = admin_client.csrf_headers
    admin_client.post(
        "/api/admin/projects",
        json={"title": "Web One", "description": "d", "category": "web"},
        headers=headers,
    )
    admin_client.post(
        "/api/admin/projects",
        json={"title": "Hardware One", "description": "d", "category": "hardware"},
        headers=headers,
    )

    resp = admin_client.get("/api/projects?category=hardware")
    titles = [p["title"] for p in resp.get_json()]
    assert "Hardware One" in titles
    assert "Web One" not in titles


def test_create_requires_core_fields(admin_client):
    resp = admin_client.post(
        "/api/admin/projects", json={"title": "Missing fields"}, headers=admin_client.csrf_headers
    )
    assert resp.status_code == 400


def test_admin_routes_require_admin_session(client):
    # Fully anonymous: CSRF's before_request check runs ahead of the view's own
    # auth decorator and rejects first (no session means no valid token either).
    resp = client.post("/api/admin/projects", json={"title": "X", "description": "d", "category": "web"})
    assert resp.status_code == 403

    # Logged in but wrong role, WITH a valid CSRF token: now the request reaches
    # api_admin_required, which should reject based on role.
    with client.session_transaction() as sess:
        sess["user_id"] = 1
        sess["role"] = "customer"
    token = client.get("/api/csrf-token").get_json()["token"]
    resp = client.post(
        "/api/admin/projects",
        json={"title": "X", "description": "d", "category": "web"},
        headers={"X-CSRFToken": token},
    )
    assert resp.status_code == 403


def test_write_without_csrf_token_is_rejected(admin_client):
    resp = admin_client.post(
        "/api/admin/projects", json={"title": "X", "description": "d", "category": "web"}
    )
    assert resp.status_code == 403


def test_update_featured_toggle_delete_and_reorder(admin_client):
    headers = admin_client.csrf_headers
    r1 = admin_client.post(
        "/api/admin/projects",
        json={"title": "P1", "description": "d", "category": "web"},
        headers=headers,
    )
    id1 = r1.get_json()["project"]["id"]
    r2 = admin_client.post(
        "/api/admin/projects",
        json={"title": "P2", "description": "d", "category": "web"},
        headers=headers,
    )
    id2 = r2.get_json()["project"]["id"]

    resp = admin_client.put(f"/api/admin/projects/{id1}", json={"featured": True}, headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["project"]["featured"] is True

    resp = admin_client.post("/api/admin/projects/reorder", json={"order": [id2, id1]}, headers=headers)
    assert resp.status_code == 200

    resp = admin_client.delete(f"/api/admin/projects/{id1}", headers=headers)
    assert resp.status_code == 200
    resp = admin_client.delete(f"/api/admin/projects/{id1}", headers=headers)
    assert resp.status_code == 404
