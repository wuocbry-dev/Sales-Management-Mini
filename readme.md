# README Onboarding Nội Bộ - Sales Management Mini
---
## 1. Giới thiệu dự án

Sales Management Mini là hệ thống quản lý bán hàng gồm:

1. Backend API (Spring Boot) cho xác thực, phân quyền, sản phẩm, kho, đơn bán, phiếu nhập, trả hàng, chuyển kho, kiểm kho, báo cáo.
2. Frontend Web (React + Vite) cho vận hành cửa hàng theo vai trò.
3. Cơ sở dữ liệu MySQL.
4. Bộ cấu hình Docker Compose để chạy nhanh full stack.

---

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ | Version theo repo |
|---|---|---|
| Backend runtime | Java | 21 ([backend/pom.xml](backend/pom.xml)) |
| Backend framework | Spring Boot | 3.4.1 ([backend/pom.xml](backend/pom.xml)) |
| Build backend | Maven | 3.9.x (Docker dùng 3.9.9) ([backend/Dockerfile](backend/Dockerfile)) |
| Frontend runtime | Node.js | 20.x khuyến nghị (Docker dùng node:20-alpine) ([frontend/Dockerfile](frontend/Dockerfile)) |
| Frontend framework | React | 19.0.0 ([frontend/package.json](frontend/package.json)) |
| Frontend build tool | Vite | 6.0.6 ([frontend/package.json](frontend/package.json)) |
| Database | MySQL | 8.x |
| Container | Docker + Docker Compose | bản mới ổn định |

---

## 3. Yêu cầu môi trường và version khuyến nghị

Có 2 cách chạy, vui lòng chọn trước:

1. Cách A - Chạy full stack bằng Docker (khuyến nghị cho onboarding nhanh).
2. Cách B - Chạy local tách riêng Backend/Frontend (khuyến nghị cho dev).

### 3.1 Bộ cài theo từng cách

| Thành phần | Cách A (Docker) | Cách B (Local) |
|---|---|---|
| Git | Bắt buộc | Bắt buộc |
| Docker Desktop | Bắt buộc | Tùy chọn |
| MySQL Server + Workbench | Bắt buộc | Bắt buộc |
| JDK 21 | Không bắt buộc | Bắt buộc |
| Maven 3.9+ | Không bắt buộc | Bắt buộc |
| Node.js 20+ + npm | Không bắt buộc | Bắt buộc |

### 3.2 Version khuyến nghị

1. Git: 2.40+
2. Docker Desktop: bản mới nhất ổn định
3. MySQL: 8.0+
4. JDK: 21.x
5. Maven: 3.9+
6. Node.js: 20 LTS (khớp Dockerfile frontend)
7. npm: đi kèm Node.js

---

## 4. Cách kiểm tra version đã cài

Mở PowerShell và chạy:

```powershell
git --version
docker --version
docker compose version
mysql --version
java -version
mvn -v
node -v
npm -v
```

Kết quả mong đợi:

1. Không có lỗi command not found.
2. Java trả về 21.x.
3. Node trả về 20.x hoặc cao hơn.
4. Maven trả về 3.9+.

---

## 5. Cách cài Git, Node.js, JDK, Maven, MySQL, Docker (Windows)

## 5.1 Cài Git

1. Truy cập https://git-scm.com/download/win
2. Tải installer và cài theo mặc định.
3. Mở PowerShell mới, chạy git --version.

## 5.2 Cài Node.js

1. Truy cập https://nodejs.org/en/download
2. Cài bản LTS (ưu tiên Node 20).
3. Kiểm tra node -v và npm -v.

## 5.3 Cài JDK 21

1. Truy cập https://adoptium.net/temurin/releases/?version=21
2. Tải bản Windows x64 MSI.
3. Cài đặt, bật tùy chọn thêm PATH nếu có.
4. Kiểm tra java -version và javac -version.

## 5.4 Cài Maven 3.9+

1. Truy cập https://maven.apache.org/download.cgi
2. Tải file zip binary, giải nén (ví dụ C:\tools\apache-maven-3.9.9).
3. Tạo biến môi trường MAVEN_HOME trỏ vào thư mục Maven.
4. Thêm MAVEN_HOME\\bin vào PATH.
5. Mở PowerShell mới, kiểm tra mvn -v.

## 5.5 Cài MySQL Server + Workbench

1. Truy cập https://dev.mysql.com/downloads/installer/
2. Tải MySQL Installer for Windows.
3. Chọn kiểu Full để có cả Server và Workbench.
4. Đặt mật khẩu user root.
5. Kiểm tra mysql --version.

## 5.6 Cài Docker Desktop

1. Truy cập https://www.docker.com/products/docker-desktop/
2. Tải bản cho Windows và cài đặt.
3. Mở Docker Desktop, chờ trạng thái Running.
4. Kiểm tra docker --version và docker compose version.

---

## 6. Clone source code

Chạy trong PowerShell:

```powershell
git clone https://github.com/.git
cd Sales-Management-Mini
git checkout main
```

Kiểm tra thư mục gốc có các mục chính:

1. [backend](backend)
2. [frontend](frontend)
3. [docker-compose-local.yml](docker-compose-local.yml)
4. [Docx](Docx)

---

## 7. Cấu hình .env / application.yml

## 7.1 Cấu hình .env cho Docker (root project)

Repo có file mẫu: [.env.docker.example](.env.docker.example)

Tạo file .env tại thư mục gốc và tham chiếu như sau:

```env
MYSQL_HOST=host.docker.internal
MYSQL_PORT=3306
MYSQL_DATABASE=sales_management_mini
MYSQL_USER=root
MYSQL_PASSWORD=12345
```

Ghi chú:

1. [docker-compose-local.yml](docker-compose-local.yml) đã có default fallback, nhưng nên tạo .env để chủ động.
2. [docker-compose.yml](docker-compose.yml) đang default về host/port nội bộ khác (100.78.133.11:1776) nên không dùng cho máy mới nếu chưa xác minh.

## 7.2 Cấu hình backend local

Repo đang dùng file external config cho local: [backend/application-local.properties.example](backend/application-local.properties.example)

Thực hiện:

1. Copy [backend/application-local.properties.example](backend/application-local.properties.example) thành backend/application-local.properties.
2. Điền thông tin DB local thực tế.
3. Khi chạy backend local, dùng profile local.

Ví dụ nội dung tối thiểu:

```properties
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/sales_management_mini?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh&useUnicode=true&characterEncoding=utf8
spring.datasource.username=root
spring.datasource.password=12345
```

## 7.3 Cấu hình frontend local

Repo có file mẫu: [frontend/.env.example](frontend/.env.example)

Với local dev, có thể để trống VITE_API_BASE_URL để dùng Vite proxy.

Ví dụ frontend/.env.local:

```env
VITE_API_BASE_URL=
```

Hoặc nếu muốn gọi trực tiếp backend:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 7.4 Về application.yml

Hiện tại repository không dùng application.yml.

1. Cấu hình backend đang ở [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties), [backend/src/main/resources/application-dev.properties](backend/src/main/resources/application-dev.properties), [backend/src/main/resources/application-docker.properties](backend/src/main/resources/application-docker.properties), và file external local ở backend/application-local.properties.
2. TODO/VERIFY: nếu team muốn chuẩn hóa sang application.yml, cần thống nhất quy ước trước khi refactor.

---

## 8. Tạo database / import SQL / migration / seed data

## 8.1 Tạo database

Mở MySQL Workbench hoặc dùng command line:

```sql
CREATE DATABASE IF NOT EXISTS sales_management_mini
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

## 8.2 Chọn chiến lược dữ liệu

### Chiến lược A - Máy mới, cần lên nhanh đầy đủ dữ liệu mẫu

Dùng [Docx/sql/newdata.sql](Docx/sql/newdata.sql)

```powershell
mysql -u root -p sales_management_mini < Docx/sql/newdata.sql
```

Lưu ý rất quan trọng:

1. newdata.sql có DROP TABLE ở đầu file, sẽ xóa dữ liệu cũ trước khi tạo lại.
2. Chỉ dùng cho môi trường dev/test/onboarding.

### Chiến lược B - DB đã có sẵn, chỉ cần nâng cấp schema

Chạy lần lượt migration:

1. [Docx/sql/migrations/20260411_schema_mysql.sql](Docx/sql/migrations/20260411_schema_mysql.sql)
2. [Docx/sql/migrations/20260415_store_scope_customers_variants.sql](Docx/sql/migrations/20260415_store_scope_customers_variants.sql)

Command:

```powershell
mysql -u root -p sales_management_mini < Docx/sql/migrations/20260411_schema_mysql.sql
mysql -u root -p sales_management_mini < Docx/sql/migrations/20260415_store_scope_customers_variants.sql
```

### Chiến lược C - Chỉ dựng schema trước, seed sau

1. Schema nền: [Docx/sql/DataBase_sale.sql](Docx/sql/DataBase_sale.sql)
2. Seed mẫu: [Docx/sql/dulieumau.sql](Docx/sql/dulieumau.sql) hoặc [Docx/sql/newdata.sql](Docx/sql/newdata.sql)

TODO/VERIFY:

1. Team cần chốt 1 luồng chuẩn duy nhất giữa DataBase_sale.sql và newdata.sql để onboarding không nhầm.

## 8.3 Flyway / migration tự động

Từ code hiện tại:

1. [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties) đang để spring.flyway.enabled=false.
2. Nghĩa là migration SQL không tự chạy khi khởi động app.
3. Cần chạy SQL thủ công theo các chiến lược ở trên.

---

## 9. Cách chạy backend

## 9.1 Chạy backend local (khuyến nghị cho dev)

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
mvn spring-boot:run
```

Kiểm tra backend chạy thành công:

1. Truy cập http://localhost:8080/api/health
2. Kỳ vọng trả về JSON có status=ok ([backend/src/main/java/com/quanlybanhang/controller/HealthController.java](backend/src/main/java/com/quanlybanhang/controller/HealthController.java)).

Lưu ý profile:

1. Mặc định [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties) đang active profile dev.
2. Profile dev trong [backend/src/main/resources/application-dev.properties](backend/src/main/resources/application-dev.properties) có default host DB nội bộ, không phù hợp cho máy mới nếu chưa cấu hình.

## 9.2 Chạy backend bằng Docker

Không cần chạy riêng backend local nếu đã chạy docker compose (xem Mục 11).

---

## 10. Cách chạy frontend

## 10.1 Chạy frontend local

```powershell
cd frontend
npm ci
npm run dev
```

Thông tin mặc định:

1. Frontend local chạy ở http://localhost:5173 ([frontend/vite.config.ts](frontend/vite.config.ts)).
2. Vite proxy /api -> http://localhost:8080.
3. Nếu dùng VITE_API_BASE_URL thì axios sẽ lấy base URL từ env ([frontend/src/lib/axios-client.ts](frontend/src/lib/axios-client.ts)).

## 10.2 Chạy frontend bằng Docker

Khi chạy docker compose, frontend chạy qua Nginx (xem [frontend/nginx-docker.conf](frontend/nginx-docker.conf)).

---

## 11. Chạy full dự án bằng Docker (khuyến nghị onboarding)

Ở thư mục gốc dự án:

```powershell
docker compose -f docker-compose-local.yml up --build
```

Truy cập:

1. Web: http://localhost:8088
2. API qua web: http://localhost:8088/api/...

Dừng container:

```powershell
# Nhấn Ctrl + C trong terminal đang chạy compose
# hoặc dọn hẳn:
docker compose -f docker-compose-local.yml down
```

---

## 12. Port mặc định và URL truy cập

| Chế độ | Frontend | Backend | Health check |
|---|---|---|---|
| Local dev | http://localhost:5173 | http://localhost:8080 | http://localhost:8080/api/health |
| Docker compose local | http://localhost:8088 | http://localhost:8080 (host map) | http://localhost:8088/api/health |

---

## 13. Checklist chạy dự án từ đầu trên máy mới

1. Đã cài Git, MySQL, Docker (và JDK/Maven/Node nếu chạy local FE-BE).
2. Đã clone source và checkout main.
3. Đã tạo database sales_management_mini.
4. Đã import SQL theo 1 chiến lược thống nhất.
5. Đã cấu hình file .env (nếu chạy Docker) hoặc backend/application-local.properties (nếu chạy local).
6. Đã chạy backend thành công và check /api/health.
7. Đã chạy frontend thành công.
8. Đã đăng nhập bằng tài khoản test.
9. Đã test tối thiểu 1 luồng nghiệp vụ (ví dụ tạo đơn bán hoặc tạo phiếu nhập).
10. Đã đọc và áp dụng lưu ý nội bộ ở Mục 18.

---

## 14. Tài khoản test (nếu dùng seed hiện tại)

Nguồn tham chiếu: [Docx/tk và mk sale.txt](Docx/tk%20và%20mk%20sale.txt)

1. admin / 123456
2. ministop / 123456
3. circlek / 123456

Lưu ý:

1. Đây là tài khoản seed cho dev/test nội bộ.
2. Không dùng trực tiếp cho production.

---

## 15. Lỗi thường gặp và cách xử lý

## 15.1 Lỗi không vào được web

Hiện tượng:

1. Không mở được http://localhost:8088 hoặc http://localhost:5173.

Cách xử lý:

1. Kiểm tra Docker Desktop có Running không (nếu chạy Docker).
2. Kiểm tra terminal có lỗi port bị chiếm không.
3. Chạy lại compose bằng docker compose -f docker-compose-local.yml up --build.

## 15.2 Lỗi backend không kết nối DB

Hiện tượng:

1. Backend startup fail do datasource.

Cách xử lý:

1. Kiểm tra MySQL service đã chạy.
2. Kiểm tra user/password DB.
3. Kiểm tra host/port trong .env hoặc application-local.properties.
4. Nếu chạy local backend, đảm bảo đang bật profile local.

## 15.3 Lỗi đăng nhập sai tài khoản/mật khẩu

Cách xử lý:

1. Kiểm tra đã import seed chưa.
2. Test lại tài khoản ở Mục 14.
3. Kiểm tra Caps Lock và layout bàn phím.

## 15.4 Lỗi 403 Forbidden

Ý nghĩa:

1. Thiếu quyền role/permission hoặc sai phạm vi store/branch.

Cách xử lý:

1. Đăng nhập account quyền cao hơn để kiểm tra mapping role.
2. Kiểm tra gán user vào store/branch.
3. Đối chiếu role UI ở [ROLE_UI_MATRIX.md](ROLE_UI_MATRIX.md).

## 15.5 CORS lỗi trên trình duyệt

Cách xử lý:

1. Với Docker profile, app đang cho phép rộng origin HTTP trong [backend/src/main/resources/application-docker.properties](backend/src/main/resources/application-docker.properties).
2. Với local dev, nên gọi API qua Vite proxy để tránh lệch origin.
3. Nếu cần mở thêm origin, kiểm tra [backend/src/main/java/com/quanlybanhang/security/SecurityConfig.java](backend/src/main/java/com/quanlybanhang/security/SecurityConfig.java).

---

## 16. Cấu trúc thư mục chính

```text
Sales-Management-Mini/
├─ backend/                    # Spring Boot API
│  ├─ src/main/java/com/quanlybanhang/
│  ├─ src/main/resources/
│  ├─ application-local.properties.example
│  ├─ pom.xml
│  └─ Dockerfile
├─ frontend/                   # React + Vite UI
│  ├─ src/
│  ├─ .env.example
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ nginx-docker.conf
│  └─ Dockerfile
├─ Docx/
│  ├─ AUTH_API_TEST.md
│  ├─ tk và mk sale.txt
│  └─ sql/
│     ├─ DataBase_sale.sql
│     ├─ dulieumau.sql
│     ├─ newdata.sql
│     └─ migrations/
├─ postman/
│  └─ QuanLyBanHang.postman_collection.json
├─ docker-compose-local.yml
├─ docker-compose.yml
├─ docker-composeprod.yml
└─ .env.docker.example
```

---

## 17. Lưu ý nội bộ quan trọng

1. Không commit file .env và file backend/application-local.properties (đã nằm trong [.gitignore](.gitignore)).
2. Không dùng default host nội bộ trong [docker-compose.yml](docker-compose.yml) cho máy mới nếu chưa xác minh mạng.
3. Không dùng config production cho môi trường local/dev.
4. Từ code hiện tại, role và permission được bootstrap tự động khi app chạy ([backend/src/main/java/com/quanlybanhang/config/DefaultRolesBootstrap.java](backend/src/main/java/com/quanlybanhang/config/DefaultRolesBootstrap.java), [backend/src/main/java/com/quanlybanhang/config/DefaultPermissionBootstrap.java](backend/src/main/java/com/quanlybanhang/config/DefaultPermissionBootstrap.java)).
5. Upload path mặc định là uploads/products theo [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties). Cần đảm bảo quyền ghi thư mục khi chạy thực tế.
6. TODO/VERIFY: nếu chạy Docker lâu dài, cần thiết kế volume cho uploads để tránh mất file khi recreate container.

---

## 18. TODO/VERIFY cần chốt với team

1. Chốt duy nhất 1 quy trình onboarding DB: newdata.sql hay DataBase_sale.sql + migrations.
2. Xác minh file [docker-composeprod.yml](docker-composeprod.yml) có đúng chuẩn production hay chỉ là bản tạm.
3. Xác minh version MySQL chuẩn nội bộ (8.0 hay 8.4) để đồng bộ toàn team.
4. Xác minh policy branch khi onboarding (main hay develop) theo quy trình release hiện tại.

---

## 19. Tài liệu tham chiếu nhanh

1. API Auth test: [Docx/AUTH_API_TEST.md](Docx/AUTH_API_TEST.md)
2. Ma trận role UI: [ROLE_UI_MATRIX.md](ROLE_UI_MATRIX.md)
3. Audit role UI: [ROLE_UI_AUDIT_REPORT.md](ROLE_UI_AUDIT_REPORT.md)
4. Postman collection: [postman/QuanLyBanHang.postman_collection.json](postman/QuanLyBanHang.postman_collection.json)

---

Nếu bạn cần, có thể tách thêm 1 file QUICKSTART_INTERNAL.md (1 trang) chỉ gồm các bước tối thiểu để người mới chạy được dự án trong 10-15 phút.
