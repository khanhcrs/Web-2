# Migration Guide: MongoDB to PostgreSQL

## Các bước hoàn thành migration:

### 1. ✅ Backend code đã được cập nhật
- Đã thay thế `mongoose` bằng `pg` (PostgreSQL client)
- Tất cả endpoints đã sử dụng parameterized queries với `$1, $2, ...`
- Connection pool đã được cấu hình cho PostgreSQL

### 2. ✅ Dependencies đã được cập nhật
- Xóa `mongoose` khỏi `package.json`
- `pg` đã được thêm (phiên bản 8.16.3)

### 3. ⚠️ Cần làm tiếp theo:

#### a) Setup PostgreSQL Database
```bash
# 1. Đảm bảo PostgreSQL đang chạy
# 2. Tạo database
psql -U postgres -c "CREATE DATABASE clothify;"

# 3. Tạo schema - chạy file db.sql
psql -U postgres -d clothify -f backend/db.sql
```

#### b) Cập nhật credentials
- Sửa file `backend/index.js` dòng 18-23 với PostgreSQL credentials của bạn
- Hoặc tạo file `.env` trong `backend/` với nội dung từ `.env.example`

```javascript
const pool = new Pool({
    user: 'postgres',              // Your PostgreSQL user
    host: 'localhost',
    database: 'clothify',          // Your database name
    password: 'your_password',     // Your PostgreSQL password
    port: 5432,
});
```

#### c) Cập nhật .env (tùy chọn)
```bash
cp backend/.env.example backend/.env
# Sửa các giá trị trong backend/.env nếu cần
```

#### d) Cài dependencies mới
```bash
cd backend
npm install
```

#### e) Xóa mongoose khỏi package-lock.json (tự động sau npm install)
```bash
npm install --package-lock-only
```

### 4. Data Migration (nếu có dữ liệu cũ)

Nếu bạn có dữ liệu MongoDB cũ cần migrate:

```bash
# Export từ MongoDB
mongoexport -d old_db_name -c products -o products.json
mongoexport -d old_db_name -c users -o users.json

# Sau đó import vào PostgreSQL bằng script Node.js hoặc tool như pgAdmin
```

### 5. Kiểm tra kết nối

```bash
# Chạy backend server
npm start --prefix backend

# Kiểm tra trong console - nên thấy:
# "Connected to PostgreSQL"
# "Server is running on port 4000"
```

### 6. Test API

```bash
# Test endpoint đơn giản
curl http://localhost:4000/

# Response: "Express App is running with PostgreSQL"
```

## Các thay đổi chính so với MongoDB:

| Khía cạnh | MongoDB | PostgreSQL |
|----------|---------|-----------|
| **Driver** | mongoose | pg |
| **Query** | Model.find() | pool.query('SELECT...') |
| **Insert** | Model.create() | pool.query('INSERT...') |
| **Update** | Model.updateOne() | pool.query('UPDATE...') |
| **Delete** | Model.deleteOne() | pool.query('DELETE...') |
| **Arrays** | Native array | JSONB type |
| **Types** | ObjectId | INTEGER/SERIAL |

## Ghi chú quan trọng:

1. **JSONB**: Cột `cart_data` sử dụng JSONB để lưu dữ liệu giống MongoDB
2. **Parameterized Queries**: Tất cả SQL queries sử dụng `$1, $2...` để tránh SQL injection
3. **Timestamps**: Sử dụng TIMESTAMP CURRENT_TIMESTAMP để auto-update
4. **Relationships**: Sử dụng FOREIGN KEY để maintain data integrity
5. **Status Field**: Users có status field với constraint CHECK (active/suspended)

## Troubleshooting:

- **"connect ECONNREFUSED"** → PostgreSQL service không chạy
- **"database clothify does not exist"** → Cần chạy `CREATE DATABASE clothify`
- **"relation products does not exist"** → Cần chạy schema file `db.sql`
- **"duplicate key value"** → Có unique constraint violation (ví dụ email)

## Environment Variables Setup:

Tạo file `backend/.env`:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=clothify
JWT_SECRET=secret_ecom
PORT=4000
```

Sau đó update `index.js` để đọc từ `.env`:
```javascript
require('dotenv').config();
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});
```
