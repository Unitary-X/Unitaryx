from backend import mailers


def test_welcome_payload_english_greets_customer():
    subject, plain, html = mailers.build_welcome_payload(name="Asha", locale="en", app_url="https://unitaryx.org")

    assert "Welcome" in subject
    assert "Asha" in plain
    assert "Hello" in plain
    assert "Welcome to Unitary X" in plain
    assert "https://unitaryx.org" in plain
    assert "Asha" in html
    assert "Welcome to Unitary X" in html


def test_welcome_payload_hindi_changes_copy():
    subject, plain, html = mailers.build_welcome_payload(name="Asha", locale="hi")

    assert "स्वागत" in subject
    assert "नमस्ते" in plain
    assert "नमस्ते" in html


def test_assigned_payload_contains_task_details():
    subject, plain, html = mailers.build_assigned_payload(
        title="Review onboarding request",
        details="Please review the new customer request.",
        assigned_by="superadmin@unitaryx.org",
        locale="en",
        app_url="https://unitaryx.org/admin",
    )

    assert "assigned" in subject.lower()
    assert "Review onboarding request" in plain
    assert "superadmin@unitaryx.org" in plain
    assert "Please review the new customer request." in html
    assert "https://unitaryx.org/admin" in html


def test_send_helpers_dispatch_with_generated_payload(monkeypatch):
    captured = {}

    def fake_deliver(subject, sender, recipient, plain, html):
        captured["subject"] = subject
        captured["sender"] = sender
        captured["recipient"] = recipient
        captured["plain"] = plain
        captured["html"] = html

    monkeypatch.setattr(mailers, "_deliver", fake_deliver)

    mailers.send_welcome_email(
        recipient="customer@example.com",
        name="Customer",
        sender="hello@unitaryx.org",
        locale="en",
        app_url="https://unitaryx.org",
    )

    assert captured["recipient"] == "customer@example.com"
    assert captured["sender"] == "hello@unitaryx.org"
    assert "Welcome" in captured["subject"]
    assert "Customer" in captured["plain"]
