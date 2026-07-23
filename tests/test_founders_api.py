def test_public_list_only_returns_active_ordered_by_display_order(superadmin_client):
    headers = superadmin_client.csrf_headers
    superadmin_client.post("/api/admin/founders", json={"name": "B", "role": "Dev", "display_order": 2}, headers=headers)
    superadmin_client.post("/api/admin/founders", json={"name": "A", "role": "Dev", "display_order": 1}, headers=headers)
    superadmin_client.post(
        "/api/admin/founders",
        json={"name": "Hidden", "role": "Dev", "active": False, "display_order": 0},
        headers=headers,
    )

    resp = superadmin_client.get("/api/founders")
    assert resp.status_code == 200
    names = [f["name"] for f in resp.get_json()]
    assert names == ["A", "B"]


def test_create_requires_name_and_role(superadmin_client):
    resp = superadmin_client.post(
        "/api/admin/founders", json={"name": "Only Name"}, headers=superadmin_client.csrf_headers
    )
    assert resp.status_code == 400


def test_admin_routes_require_admin_session(client):
    # Fully anonymous: CSRF's before_request check runs ahead of the view's own
    # auth decorator and rejects first (no session means no valid token either).
    resp = client.post("/api/admin/founders", json={"name": "X", "role": "Y"})
    assert resp.status_code == 403

    # Logged in but wrong role, WITH a valid CSRF token: now the request reaches
    # api_superadmin_required, which should reject based on role.
    with client.session_transaction() as sess:
        sess["user_id"] = 1
        sess["role"] = "customer"
    token = client.get("/api/csrf-token").get_json()["token"]
    resp = client.post(
        "/api/admin/founders", json={"name": "X", "role": "Y"}, headers={"X-CSRFToken": token}
    )
    assert resp.status_code == 403


def test_ordinary_admin_is_blocked_founders_are_superadmin_only(admin_client):
    """Founders/Projects management is deliberately locked to the superadmin
    account — an ordinary ops-scope admin must be rejected, not just consumers."""
    resp = admin_client.get("/api/admin/founders")
    assert resp.status_code == 403

    resp = admin_client.post(
        "/api/admin/founders", json={"name": "X", "role": "Y"}, headers=admin_client.csrf_headers
    )
    assert resp.status_code == 403


def test_write_without_csrf_token_is_rejected(superadmin_client):
    resp = superadmin_client.post("/api/admin/founders", json={"name": "X", "role": "Y"})
    assert resp.status_code == 403


def test_update_delete_and_reorder_roundtrip(superadmin_client):
    headers = superadmin_client.csrf_headers
    r1 = superadmin_client.post("/api/admin/founders", json={"name": "First", "role": "Dev"}, headers=headers)
    id1 = r1.get_json()["founder"]["id"]
    r2 = superadmin_client.post("/api/admin/founders", json={"name": "Second", "role": "Dev"}, headers=headers)
    id2 = r2.get_json()["founder"]["id"]

    resp = superadmin_client.put(f"/api/admin/founders/{id1}", json={"role": "Lead"}, headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["founder"]["role"] == "Lead"

    resp = superadmin_client.post("/api/admin/founders/reorder", json={"order": [id2, id1]}, headers=headers)
    assert resp.status_code == 200
    ordered = superadmin_client.get("/api/founders").get_json()
    assert [f["id"] for f in ordered] == [id2, id1]

    resp = superadmin_client.delete(f"/api/admin/founders/{id2}", headers=headers)
    assert resp.status_code == 200
    resp = superadmin_client.delete(f"/api/admin/founders/{id2}", headers=headers)
    assert resp.status_code == 404


def test_upload_rejects_bad_extension_and_corrupt_image(superadmin_client):
    from io import BytesIO

    headers = superadmin_client.csrf_headers
    resp = superadmin_client.post(
        "/api/admin/upload",
        data={"kind": "founders", "file": (BytesIO(b"hello"), "notes.txt")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400

    resp = superadmin_client.post(
        "/api/admin/upload",
        data={"kind": "founders", "file": (BytesIO(b"not a real jpeg"), "photo.jpg")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400


def test_upload_accepts_and_resizes_real_image(superadmin_client, tmp_path, monkeypatch):
    from io import BytesIO
    from PIL import Image
    import backend.app as app_module

    monkeypatch.setattr(app_module, "PROJECT_ROOT", str(tmp_path))

    buf = BytesIO()
    Image.new("RGB", (40, 40), (10, 20, 30)).save(buf, format="PNG")
    buf.seek(0)

    resp = superadmin_client.post(
        "/api/admin/upload",
        data={"kind": "projects", "file": (buf, "photo.png")},
        headers=superadmin_client.csrf_headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    assert body["url"].startswith("/static/uploads/projects/")


def test_ordinary_admin_upload_is_blocked(admin_client):
    from io import BytesIO

    resp = admin_client.post(
        "/api/admin/upload",
        data={"kind": "founders", "file": (BytesIO(b"x"), "photo.jpg")},
        headers=admin_client.csrf_headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 403
