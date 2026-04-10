# Hướng dẫn test nhanh API Auth (JWT)

Base URL ví dụ: `http://localhost:8080`. Header JSON: `Content-Type: application/json`.

## Mã lỗi thống nhất (field `code` trong body)

| HTTP | `code` | Khi nào |
|------|--------|---------|
| 401 | `UNAUTHORIZED` | Thiếu/sai Bearer token (API protected) |
| 401 | `INVALID_CREDENTIALS` | Sai mật khẩu / user không tồn tại (login) |
| 403 | `ACCOUNT_LOCKED` | Tài khoản bị khóa (login) |
| 403 | `ACCOUNT_INACTIVE` | Tài khoản inactive / trạng thái không hợp lệ (login) |
| 403 | `FORBIDDEN` | Đủ đăng nhập nhưng không đủ quyền (`@PreAuthorize`) hoặc sai store (guard) |
| 409 | `USERNAME_ALREADY_EXISTS` | Đăng ký trùng username |
| 409 | `EMAIL_ALREADY_EXISTS` | Đăng ký trùng email |

## 1. Register

`POST /api/auth/register`

```json
{
  "username": "user1",
  "email": "user1@example.com",
  "password": "secret12",
  "fullName": "User One",
  "phone": null
}
```

## 2. Login

`POST /api/auth/login`

```json
{
  "username": "user1",
  "password": "secret12"
}
```

Lưu `accessToken` từ response (hoặc biến Postman `{{accessToken}}`).

## 3. Me (cần token)

`GET /api/auth/me`  
Header: `Authorization: Bearer <accessToken>`

## 4. Protected — không có token

Ví dụ `GET /api/auth/me` **không** gửi `Authorization` → **401**, `code`: `UNAUTHORIZED`.

## 5. Protected — có token hợp lệ

Cùng request `GET /api/auth/me` với `Authorization: Bearer ...` → **200**.

## 6. Không đủ quyền (ví dụ user CASHIER gọi API chỉ ADMIN)

Sau khi login user không phải ADMIN, gọi ví dụ:

`GET /api/users`  

Header: `Authorization: Bearer <token>`  

→ **403**, `code`: `FORBIDDEN`.

## 7. Sai store (đã bật guard)

Ví dụ user chỉ được gán store `1`, gọi:

`GET /api/inventories?storeId=999`  

với Bearer token của user đó → **403**, `code`: `FORBIDDEN`, message liên quan cửa hàng.

ADMIN bỏ qua guard store.

## Gợi ý Postman

- Tạo biến collection `baseUrl`, `accessToken`.
- Sau Login: Tests → `pm.collectionVariables.set("accessToken", pm.response.json().accessToken);`
- Request sau: Authorization → Bearer Token → `{{accessToken}}`.
