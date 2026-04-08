# Clothify XAMPP + MySQL Guide

## 1. Start XAMPP

Open `XAMPP Control Panel` and start:

- `Apache`
- `MySQL`

## 2. Create a fresh MySQL database

Open `http://localhost/phpmyadmin`.

Import these files in order:

1. [backend-php/database/schema.mysql.sql](/c:/Users/asus/Downloads/Web-2/backend-php/database/schema.mysql.sql)
2. [backend-php/database/seed.mysql.sql](/c:/Users/asus/Downloads/Web-2/backend-php/database/seed.mysql.sql)

This creates:

- database `clothify`
- all backend tables
- default admin account

Default admin:

- email: `admin@clothify.com`
- password: `Admin@123`

## 3. Configure backend PHP for MySQL

Copy:

- `backend-php/.env.mysql.example`

to:

- `backend-php/.env`

Recommended content:

```env
DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=clothify
MYSQL_USER=root
MYSQL_PASSWORD=

JWT_SECRET=secret_ecom
ADMIN_EMAIL=admin@clothify.com
ADMIN_NAME=Clothify Admin
ADMIN_PASSWORD=Admin@123
```

## 4. Put backend under Apache

Simplest local setup:

1. Copy or map `backend-php` into your XAMPP web root.
2. Point Apache to [backend-php/public](/c:/Users/asus/Downloads/Web-2/backend-php/public).

Example URL if you copy the folder into `C:\xampp\htdocs\clothify-api\`:

- `http://localhost/clothify-api/public/`

Important:

- [backend-php/public/.htaccess](/c:/Users/asus/Downloads/Web-2/backend-php/public/.htaccess) must be enabled
- Apache `mod_rewrite` must be on

## 5. Test API routes

After Apache is up, test:

- `http://localhost/clothify-api/public/`
- `http://localhost/clothify-api/public/allproducts`
- `http://localhost/clothify-api/public/users`

The backend now supports:

- PostgreSQL mode
- MySQL/XAMPP mode

The active mode is selected by `DB_DRIVER`.

## 6. Images

New uploads go to:

- `backend-php/public/images`

Old migrated images are still readable from:

- `backend-php/storage/upload/images`

Apache image requests such as `/images/<file>` are handled by:

- [backend-php/public/image.php](/c:/Users/asus/Downloads/Web-2/backend-php/public/image.php)

## 7. Frontend/Admin API URL

If frontend/admin still run locally, point them to your Apache backend URL.

Example:

- `http://localhost/clothify-api/public`

If you later serve frontend/admin from Apache too, use the same backend base URL in their config.

## 8. Rollback

To go back to PostgreSQL runtime:

1. Restore `backend-php/.env` to PostgreSQL config.
2. Set `DB_DRIVER=pgsql` or remove it.
3. Run the existing PHP local runtime again if needed.

Legacy Node backend is still archived at:

- [legacy/backend-nodejs-archive](/c:/Users/asus/Downloads/Web-2/legacy/backend-nodejs-archive)
