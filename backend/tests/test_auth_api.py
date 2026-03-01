def test_signup_login_and_me_flow(client):
    signup_payload = {
        "full_name": "Alicia Gomez",
        "email": "alicia@example.com",
        "password": "StrongPass123",
    }
    signup_response = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_response.status_code == 201

    data = signup_response.json()
    assert data["user"]["email"] == "alicia@example.com"
    assert data["user"]["role"] == "admin"
    assert "access_token" in data["token"]

    token = data["token"]["access_token"]
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["full_name"] == "Alicia Gomez"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "alicia@example.com", "password": "StrongPass123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == "alicia@example.com"


def test_signup_rejects_duplicate_email(client):
    payload = {
        "full_name": "Dev One",
        "email": "duplicate@example.com",
        "password": "StrongPass123",
    }
    first = client.post("/api/v1/auth/signup", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/signup", json=payload)
    assert second.status_code == 409
    assert second.json()["detail"] == "Email is already registered"


def test_login_with_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/signup",
        json={
            "full_name": "Dev Two",
            "email": "dev2@example.com",
            "password": "StrongPass123",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "dev2@example.com", "password": "WrongPass123"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"
