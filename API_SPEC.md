# FocusFlow Backend API Specification

Tài liệu đặc tả chi tiết toàn bộ hệ thống API của FocusFlow Backend (phiên bản `/api/v1`).

---

## 1. Authentication APIs (`/api/v1/auth`)

### 1.1. Đăng nhập / Đăng ký trực tiếp bằng Google OAuth 2.0

- **Method & URL:** `POST /api/v1/auth/google`
- **Headers:** `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "auth_code": "4/0AeaYSHC..."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "65c2b3f12a83f819001aaaaa",
        "email": "lam.dev@gmail.com",
        "full_name": "Lam dev",
        "avatar": null,
        "is_verified": true,
        "auth_provider": "google"
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```
- **Cookies Set:** `access_token` (15 phút), `refresh_token` (7 ngày).

---

## 2. Quản lý Hồ sơ & OAuth (`/api/v1/profile`)

### 2.1. Lấy thông tin hồ sơ (GET /api/v1/profile)

- **Headers:** `Authorization: Bearer <access_token>`
- **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "65c2b3f12a83f819001aaaaa",
        "email": "lam.dev@focusflow.com",
        "full_name": "Lam dev",
        "avatar_url": "https://...",
        "social_links": {
          "github": { "is_linked": true, "username": "lam_dev" },
          "google": { "is_linked": false, "username": null }
        }
      }
    }
  }
  ```

### 2.2. Cập nhật hồ sơ (PUT /api/v1/profile)

- **Payload:** `{ "full_name": "Lam dev updated", "avatar_url": "https://..." }`

### 2.3. Tải ảnh đại diện (POST /api/v1/profile/avatar)

- **Headers:** `Content-Type: multipart/form-data`
- **Payload:** `file` (Binary image)

### 2.4. Hủy liên kết mạng xã hội (POST /api/v1/profile/oauth/unlink)

- **Payload:** `{ "provider": "github" | "google" }`

### 2.5. Thực hiện liên kết tài khoản mạng xã hội (POST /api/v1/profile/oauth/link)

- **Payload:** `{ "provider": "google", "auth_code": "..." }`
