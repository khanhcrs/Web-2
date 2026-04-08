# Clothify PHP Runtime

XAMPP + MySQL guide: `XAMPP_MYSQL_GUIDE.md`

Repo này đã được chuyển sang mô hình runtime mới:

- `backend-php/`: backend PHP chạy ở `http://127.0.0.1:8000`
- `frontend/build/`: storefront bundle tĩnh được PHP serve ở `http://127.0.0.1:3000`
- `admin/dist/`: admin bundle tĩnh được PHP serve ở `http://127.0.0.1:5173`
- `legacy/backend-nodejs-archive/`: backend Node.js cũ để rollback khi cần

## Chạy hằng ngà


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
