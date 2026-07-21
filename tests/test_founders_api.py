def test_public_list_only_returns_active_ordered_by_display_order(admin_client):
    headers = admin_client.csrf_headers
    admin_client.post("/api/admin/founders", json={"name": "B", "role": "Dev", "display_order": 2}, headers=headers)
    admin_client.post("/api/admin/founders", json={"name": "A", "role": "Dev", "display_order": 1}, headers=headers)
    admin_client.post(
        "/api/admin/founders",
        json={"name": "Hidden", "role": "Dev", "active": False, "display_order": 0},
        headers=headers,
    )

    resp = admin_client.get("/api/founders")
    assert resp.status_code == 200
    names = [f["name"] for f in resp.get_json()]
    assert names == ["A", "B"]


def test_create_requires_name_and_role(admin_client):
    resp = admin_client.post("/api/admin/founders", json={"name": "Only Name"}, headers=admin_client.csrf_headers)
    assert resp.status_code == 400


def test_admin_routes_require_admin_session(client):
    # Fully anonymous: CSRF's before_request check runs ahead of the view's own
    # auth decorator and rejects first (no session means no valid token either).
    resp = client.post("/api/admin/founders", json={"name": "X", "role": "Y"})
    assert resp.status_code == 403

    # Logged in but wrong role, WITH a valid CSRF token: now the request reaches
    # api_admin_required, which should reject based on role.
    with client.session_transaction() as sess:
        sess["user_id"] = 1
        sess["role"] = "customer"
    token = client.get("/api/csrf-token").get_json()["token"]
    resp = client.post(
        "/api/admin/founders", json={"name": "X", "role": "Y"}, headers={"X-CSRFToken": token}
    )
    assert resp.status_code == 403


def test_write_without_csrf_token_is_rejected(admin_client):
    resp = admin_client.post("/api/admin/founders", json={"name": "X", "role": "Y"})
    assert resp.status_code == 403


def test_update_delete_and_reorder_roundtrip(admin_client):
    headers = admin_client.csrf_headers
    r1 = admin_client.post("/api/admin/founders", json={"name": "First", "role": "Dev"}, headers=headers)
    id1 = r1.get_json()["founder"]["id"]
    r2 = admin_client.post("/api/admin/founders", json={"name": "Second", "role": "Dev"}, headers=headers)
    id2 = r2.get_json()["founder"]["id"]

    resp = admin_client.put(f"/api/admin/founders/{id1}", json={"role": "Lead"}, headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["founder"]["role"] == "Lead"

    resp = admin_client.post("/api/admin/founders/reorder", json={"order": [id2, id1]}, headers=headers)
    assert resp.status_code == 200
    ordered = admin_client.get("/api/founders").get_json()
    assert [f["id"] for f in ordered] == [id2, id1]

    resp = admin_client.delete(f"/api/admin/founders/{id2}", headers=headers)
    assert resp.status_code == 200
    resp = admin_client.delete(f"/api/admin/founders/{id2}", headers=headers)
    assert resp.status_code == 404


def test_upload_rejects_bad_extension_and_corrupt_image(admin_client):
    from io import BytesIO

    headers = admin_client.csrf_headers
    resp = admin_client.post(
        "/api/admin/upload",
        data={"kind": "founders", "file": (BytesIO(b"hello"), "notes.txt")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400

    resp = admin_client.post(
        "/api/admin/upload",
        data={"kind": "founders", "file": (BytesIO(b"not a real jpeg"), "photo.jpg")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400


def test_upload_accepts_and_resizes_real_image(admin_client, tmp_path, monkeypatch):
    from io import BytesIO
    from PIL import Image
    import backend.app as app_module

    monkeypatch.setattr(app_module, "PROJECT_ROOT", str(tmp_path))

    buf = BytesIO()
    Image.new("RGB", (40, 40), (10, 20, 30)).save(buf, format="PNG")
    buf.seek(0)

    resp = admin_client.post(
        "/api/admin/upload",
        data={"kind": "projects", "file": (buf, "photo.png")},
        headers=admin_client.csrf_headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    assert body["url"].startswith("/static/uploads/projects/")
