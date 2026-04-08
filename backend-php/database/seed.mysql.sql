-- Minimal starter data for a fresh XAMPP MySQL/MariaDB database.
-- Admin password for the row below: Admin@123

USE clothify;

INSERT INTO users (name, email, password, role, status, cart_data)
VALUES (
    'Clothify Admin',
    'admin@clothify.com',
    '$2y$10$.zeexipk/cWngu0p9MgLpuoG/3Bf7Kqds7GlF6WdzW8vsuumgN0Ni',
    'admin',
    'active',
    '{}'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    role = VALUES(role),
    status = VALUES(status);

INSERT INTO products (
    code,
    name,
    description,
    unit,
    image,
    images,
    category,
    new_price,
    old_price,
    available,
    status,
    stock_quantity,
    current_import_price,
    profit_margin
)
VALUES (
    'SP001',
    'Ao thun basic',
    'San pham mau cho database moi',
    'Cai',
    '/images/product_demo_sp001.png',
    '["/images/product_demo_sp001.png"]',
    'men',
    199000,
    249000,
    1,
    'active',
    20,
    120000,
    65
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    unit = VALUES(unit),
    image = VALUES(image),
    images = VALUES(images),
    category = VALUES(category),
    new_price = VALUES(new_price),
    old_price = VALUES(old_price),
    available = VALUES(available),
    status = VALUES(status),
    stock_quantity = VALUES(stock_quantity),
    current_import_price = VALUES(current_import_price),
    profit_margin = VALUES(profit_margin);
