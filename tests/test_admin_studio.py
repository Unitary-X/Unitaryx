def test_studio_requires_login(client):
    resp = client.get("/admin/studio")
    assert resp.status_code == 302  # redirected to login


def test_studio_blocks_non_admin(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 1
        sess["role"] = "user"
    resp = client.get("/admin/studio")
    assert resp.status_code == 302  # non-admin redirected, not served


def test_studio_serves_spa_for_admin(admin_client):
    resp = admin_client.get("/admin/studio")
    assert resp.status_code == 200
    assert b'id="root"' in resp.data


def test_classic_admin_retired_redirects_to_studio(admin_client):
    # Phase 6 retired the Jinja panel; /admin now forwards to the React studio.
    resp = admin_client.get("/admin")
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/admin/studio")
