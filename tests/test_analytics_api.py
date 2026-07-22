"""Phase 4: analytics + A/B test API coverage.

The analytics read endpoints are reused as-is from the classic admin panel so the
React studio reports identical numbers; these tests pin the contract the studio
depends on.
"""


def test_ab_tests_requires_auth(client):
    assert client.get("/api/admin/ab-tests").status_code == 401


def test_ab_tests_blocks_non_admin(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 1
        sess["role"] = "user"
    assert client.get("/api/admin/ab-tests").status_code == 403


def test_ab_tests_list_shape(admin_client):
    body = admin_client.get("/api/admin/ab-tests").get_json()
    assert "can_edit" in body
    assert isinstance(body["tests"], list)
    if body["tests"]:
        t = body["tests"][0]
        assert set(t.keys()) == {
            "id",
            "test_key",
            "label",
            "enabled",
            "allocation_b",
            "variant_a",
            "variant_b",
            "updated_at",
        }


def test_ab_test_update_requires_csrf(admin_client):
    tests = admin_client.get("/api/admin/ab-tests").get_json()["tests"]
    if not tests:
        return
    resp = admin_client.put(f"/api/admin/ab-tests/{tests[0]['id']}", json={"allocation_b": 10})
    assert resp.status_code == 403  # CSRF rejects before the view runs


def test_ab_test_edit_requires_superadmin(admin_client):
    """An 'ops' admin can read A/B configs but must not be able to edit them —
    mirrors the classic panel's admin_control gate."""
    body = admin_client.get("/api/admin/ab-tests").get_json()
    assert body["can_edit"] is False
    if not body["tests"]:
        return
    resp = admin_client.put(
        f"/api/admin/ab-tests/{body['tests'][0]['id']}",
        json={"allocation_b": 10},
        headers=admin_client.csrf_headers,
    )
    assert resp.status_code == 403


def test_superadmin_can_edit(superadmin_client):
    assert superadmin_client.get("/api/admin/ab-tests").get_json()["can_edit"] is True


def test_ab_test_update_persists_and_clamps(superadmin_client):
    tests = superadmin_client.get("/api/admin/ab-tests").get_json()["tests"]
    if not tests:
        return
    tid = tests[0]["id"]
    resp = superadmin_client.put(
        f"/api/admin/ab-tests/{tid}",
        json={"enabled": True, "allocation_b": 250, "variant_a": "A copy", "variant_b": "B copy"},
        headers=superadmin_client.csrf_headers,
    )
    assert resp.status_code == 200
    updated = resp.get_json()["test"]
    assert updated["allocation_b"] == 100  # clamped to 0..100
    assert updated["variant_a"] == "A copy"

    # persisted across a fresh read
    again = superadmin_client.get("/api/admin/ab-tests").get_json()["tests"]
    assert next(t for t in again if t["id"] == tid)["variant_b"] == "B copy"


def test_ab_test_update_rejects_empty_variant(superadmin_client):
    tests = superadmin_client.get("/api/admin/ab-tests").get_json()["tests"]
    if not tests:
        return
    resp = superadmin_client.put(
        f"/api/admin/ab-tests/{tests[0]['id']}",
        json={"variant_a": "   ", "variant_b": "B"},
        headers=superadmin_client.csrf_headers,
    )
    assert resp.status_code == 400


def test_ab_test_update_404_for_missing(superadmin_client):
    resp = superadmin_client.put(
        "/api/admin/ab-tests/999999",
        json={"allocation_b": 10},
        headers=superadmin_client.csrf_headers,
    )
    assert resp.status_code == 404


def test_analytics_endpoints_serve_admin(admin_client):
    for path in (
        "/admin/api/traffic-summary",
        "/admin/api/live-users",
        "/admin/api/live-website-users",
        "/admin/api/traffic-daily-pages?days=7",
    ):
        resp = admin_client.get(path)
        assert resp.status_code == 200, path
        assert resp.get_json() is not None, path


def test_daily_pages_shape_matches_requested_range(admin_client):
    body = admin_client.get("/admin/api/traffic-daily-pages?days=7").get_json()
    assert len(body["labels"]) == 7
    assert {d["label"] for d in body["datasets"]} == {
        "Home",
        "Login",
        "Dashboard",
        "Portfolio",
        "Other",
    }
    for ds in body["datasets"]:
        assert len(ds["data"]) == 7
