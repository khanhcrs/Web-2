# Web-2 (Clothify) – Hướng dẫn setup & chạy dự án đầy đủ

Đây là monorepo gồm **3 ứng dụng chạy cùng nhau**:

- `backend/`: API server dùng **Node.js + Express + PostgreSQL**.
- `frontend/`: website khách hàng (React + CRA).
- `admin/`: trang quản trị (React + Vite).

---

## 1) Yêu cầu môi trường

Cài sẵn các công cụ sau:

- **Node.js**: khuyến nghị `v18` hoặc `v20`.
- **npm**: đi kèm Node.js.
- **PostgreSQL**: khuyến nghị `v14+`.
- (Tuỳ chọn) `psql` hoặc PgAdmin để import schema.

Kiểm tra nhanh:

```bash
node -v
npm -v
psql --version
```

---

## 2) Clone source code

```bash
git clone <REPO_URL>
cd Web-2
```

> Nếu bạn đã có source, chỉ cần vào đúng thư mục dự án rồi pull code mới nhất.

---

## 3) Cài dependencies cho từng app

Chạy từ thư mục gốc `Web-2`:

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin
```

---

## 4) Chuẩn bị PostgreSQL database

### 4.1 Tạo database

Mặc định backend đang kết nối DB:

- host: `localhost`
- port: `5432`
- user: `postgres`
- password: `123123`
- database: `clothify`

Bạn có thể tạo DB bằng lệnh:

```bash
createdb -U postgres clothify
```

Hoặc trong `psql`:

```sql
CREATE DATABASE clothify;
```

### 4.2 Import schema

File schema có sẵn tại: `backend/db.sql`.

```bash
psql -U postgres -d clothify -f backend/db.sql
```

Schema này tạo các bảng:

- `users`
- `products`
- `orders`
- `order_items`

### 4.3 Lưu ý tài khoản admin mặc định

Khi backend chạy lần đầu, hệ thống sẽ tự seed tài khoản admin nếu chưa có:

- Email: `admin@clothify.com`
- Password: `Admin@123`

Ngoài ra có thể override bằng biến môi trường:

- `ADMIN_EMAIL`
- `ADMIN_NAME`
- `ADMIN_PASSWORD`

---

## 5) Cấu hình môi trường (khuyến nghị)

Hiện tại backend dùng cấu hình PostgreSQL hard-code trong `backend/index.js`.
Nếu máy bạn dùng thông tin DB khác, sửa trực tiếp đoạn `new Pool({...})` trong file này.

Về API URL:

- Frontend mặc định gọi API tại `http://localhost:4000`.
- Admin mặc định gọi API tại `http://localhost:4000`.

Bạn có thể đổi bằng biến môi trường:

### Frontend (`frontend/.env`)

```env
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_ADMIN_PORTAL_URL=http://localhost:5173
```

### Admin (`admin/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 6) Chạy dự án ở chế độ development

### Cách A: chạy từng service (khuyên dùng khi debug)

Mở **3 terminal** tại thư mục gốc dự án.

**Terminal 1 – Backend**

```bash
npm start --prefix backend
```

Backend chạy ở: `http://localhost:4000`

**Terminal 2 – Admin**

```bash
npm run dev --prefix admin
```

Admin thường chạy ở: `http://localhost:5173`

**Terminal 3 – Frontend**

```bash
npm start --prefix frontend
```

Frontend thường chạy ở: `http://localhost:3000`

---

### Cách B: chạy tất cả bằng 1 lệnh

Dự án có script tiện ích:

```bash
./scripts/dev-all.sh
```

Script sẽ tự khởi chạy backend + admin + frontend và dừng toàn bộ khi nhấn `Ctrl + C`.

---

## 7) Kiểm tra nhanh sau khi chạy

1. Mở `http://localhost:3000` (storefront).
2. Mở `http://localhost:5173` (admin).
3. Gọi thử API:

```bash
curl http://localhost:4000/
```

Nếu OK sẽ trả về:

```text
Express App is running with PostgreSQL
```

---

## 8) Build production

```bash
npm run build --prefix frontend
npm run build --prefix admin
```

Backend là Node server nên deploy bằng cách chạy:

```bash
npm start --prefix backend
```

> Khi deploy thật, nhớ cấu hình domain, HTTPS, reverse proxy (Nginx), và thông tin DB phù hợp môi trường production.

---

## 9) Các lỗi thường gặp & cách xử lý

### Lỗi kết nối PostgreSQL

- Kiểm tra PostgreSQL đã chạy chưa.
- Kiểm tra đúng user/password/database trong `backend/index.js`.
- Kiểm tra đã import `backend/db.sql` chưa.

### Port bị trùng

- `3000`, `4000`, `5173` đang bị app khác dùng.
- Tắt app đang chiếm port hoặc đổi port cấu hình.

### Frontend/Admin không load được ảnh

- Kiểm tra backend đang chạy.
- Kiểm tra URL API trong `frontend/src/config.js` và `admin/src/config.js`.
- Kiểm tra đường dẫn ảnh trả về từ backend có prefix `/images/...`.

### Login admin nhưng không vào trang quản trị

- Xác nhận đăng nhập bằng tài khoản có role `admin`.
- Kiểm tra admin app (`5173`) đang chạy.

---

## 10) Gợi ý quy trình setup nhanh cho máy mới

```bash
# 1) Cài dependencies
npm install --prefix backend && npm install --prefix frontend && npm install --prefix admin

# 2) Tạo DB + import schema
createdb -U postgres clothify
psql -U postgres -d clothify -f backend/db.sql

# 3) Chạy cả 3 service
./scripts/dev-all.sh
```

Chúc bạn setup thành công 🚀
