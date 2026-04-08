# Clothify PHP Runtime

XAMPP + MySQL guide: `XAMPP_MYSQL_GUIDE.md`

Repo này đã được chuyển sang mô hình runtime mới:

- `backend-php/`: backend PHP chạy ở `http://127.0.0.1:8000`
- `frontend/build/`: storefront bundle tĩnh được PHP serve ở `http://127.0.0.1:3000`
- `admin/dist/`: admin bundle tĩnh được PHP serve ở `http://127.0.0.1:5173`
- `legacy/backend-nodejs-archive/`: backend Node.js cũ để rollback khi cần

## Chạy hằng ngày

Chỉ cần PHP 8.2+ và PostgreSQL đang chạy.

```bat
.\start-clothify.bat
```

Dừng toàn bộ:

```bat
.\stop-clothify.bat
```

Launcher sẽ:

- chạy 3 PHP server nền
- lưu PID vào `%TEMP%\clothify-runtime\clothify-pids.txt`
- ghi log vào `%TEMP%\clothify-runtime\logs`

## Cổng mặc định

- Frontend: `http://127.0.0.1:3000`
- Admin: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`

Admin hiện có màn hình đăng nhập riêng tại:

```text
http://127.0.0.1:5173/login
```

Nếu đăng nhập admin từ storefront, frontend sẽ tự chuyển sang admin login kèm session để auto sign-in.

## Database

Backend PHP đọc cấu hình PostgreSQL từ biến môi trường hoặc `backend-php/.env`.

Mẫu cấu hình:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=clothify
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123123

JWT_SECRET=secret_ecom

ADMIN_EMAIL=admin@clothify.com
ADMIN_NAME=Clothify Admin
ADMIN_PASSWORD=Admin@123
```

Nếu chưa có file `.env`, backend sẽ dùng fallback mặc định giống `.env.example`.

Schema chuẩn nằm ở:

```text
backend-php/database/schema.sql
```

Backend cũng tự bootstrap và align schema khi khởi động.

## Runtime mới hoạt động thế nào

- Backend PHP đã giữ các route tương thích với backend Node cũ như:
  - `/`
  - `/upload`
  - `/addproduct`
  - `/removeproduct`
  - `/product/:id`
  - `/allproducts`
  - `/register`
  - `/login`
  - `/users`
  - `/users/:userId/status`
  - `/users/:userId/role`
  - `/addtocart`
  - `/removefromcart`
  - `/my-orders`
  - `/order/:orderId`
  - `/orders`
  - `/addreview`
  - `/reviews/:productId`
  - `/import-receipts`
  - `/import-receipts/:id`
  - `/import-receipts/:id/complete`
  - `/update-profit-margin`
  - `/api/reports/stock-at-time`
  - `/api/reports/import-export`
  - `/api/reports/low-stock`
- Ảnh upload cũ đã được migrate sang `backend-php/storage/upload/images`
- Frontend/Admin đã chuyển sang gọi API cổng `8000`
- Các API quản trị quan trọng đã yêu cầu `Bearer` token admin

## Rollback về backend Node.js

Archive backend cũ nằm tại:

```text
legacy/backend-nodejs-archive
```

Khôi phục lại thư mục `backend/` từ archive:

```bat
.\rollback-clothify-backend.bat
```

Sau đó có thể chạy legacy backend lại bằng:

```bat
npm start --prefix backend
```

Lưu ý:

- rollback script chỉ khôi phục lại thư mục backend Node.js cũ
- frontend/admin hiện tại đang mặc định trỏ tới API PHP cổng `8000`
- nếu rollback hoàn toàn sang Node runtime, cần đổi lại API base URL hoặc chạy reverse proxy tương ứng

## Rebuild bundle nếu sau này sửa frontend/admin

Runtime hằng ngày không cần Node.js, nhưng nếu bạn sửa source ở `frontend/src` hoặc `admin/src` thì cần build lại bundle một lần:

```bat
cd frontend
npm install
npm run build

cd ..\admin
npm install
npm run build
```

Sau khi build xong, vẫn chạy ứng dụng bằng:

```bat
.\start-clothify.bat
```

## Smoke test nhanh

Sau khi start, kiểm tra:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/cart`
- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/addproduct`

## Ghi chú

- `frontend/build/` và `admin/dist/` là bundle runtime hiện tại
- `legacy/backend-nodejs-archive/` giữ nguyên backend Node.js cũ để khôi phục khi cần
- không cần Node.js để chạy app hằng ngày nữa
