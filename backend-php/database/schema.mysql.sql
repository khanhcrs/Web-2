-- Starter MySQL/MariaDB schema for XAMPP.
-- This mirrors the current PHP backend data model as closely as possible.
-- Note: the current backend-php runtime still contains PostgreSQL-specific SQL.
-- This file prepares a fresh MySQL database only; application code still needs
-- a PostgreSQL-to-MySQL port before daily runtime can switch safely.

CREATE DATABASE IF NOT EXISTS clothify
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clothify;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    cart_data LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'Cai',
    image VARCHAR(255) NULL,
    images LONGTEXT NULL,
    category VARCHAR(100) NULL,
    new_price DOUBLE NOT NULL DEFAULT 0,
    old_price DOUBLE NOT NULL DEFAULT 0,
    available TINYINT(1) NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    stock_quantity INT NOT NULL DEFAULT 0,
    current_import_price DOUBLE NOT NULL DEFAULT 0,
    profit_margin DOUBLE NOT NULL DEFAULT 0,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    customer_id INT UNSIGNED NULL,
    customer_name VARCHAR(255) NULL,
    customer_email VARCHAR(255) NULL,
    total DOUBLE NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_address LONGTEXT NULL,
    shipping_method VARCHAR(255) NULL,
    payment_method VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_order_id (order_id),
    KEY idx_orders_customer_id (customer_id),
    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NULL,
    name VARCHAR(255) NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DOUBLE NOT NULL DEFAULT 0,
    size VARCHAR(50) NULL,
    image VARCHAR(255) NULL,
    code VARCHAR(50) NULL,
    unit VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_items_order_id (order_id),
    KEY idx_order_items_product_id (product_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    user_name VARCHAR(255) NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reviews_product_id (product_id),
    KEY idx_reviews_user_id (user_id),
    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS import_receipts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    receipt_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    PRIMARY KEY (id),
    UNIQUE KEY uq_import_receipts_code (receipt_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS import_receipt_details (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    receipt_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    import_price DOUBLE NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_import_receipt_details_receipt_id (receipt_id),
    KEY idx_import_receipt_details_product_id (product_id),
    CONSTRAINT fk_import_receipt_details_receipt
        FOREIGN KEY (receipt_id) REFERENCES import_receipts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_import_receipt_details_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
