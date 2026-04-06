<?php

declare(strict_types=1);

namespace ClothifyPhp;

use PDO;

final class SchemaManager
{
    private bool $bootstrapped = false;

    public function ensureReady(PDO $pdo): void
    {
        if ($this->bootstrapped) {
            return;
        }

        $pdo->beginTransaction();

        try {
            $this->createTables($pdo);
            $this->alignLegacySchema($pdo);
            $this->ensureDefaultAdmin($pdo);
            $pdo->commit();
            $this->bootstrapped = true;
        } catch (\Throwable $throwable) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $throwable;
        }
    }

    private function createTables(PDO $pdo): void
    {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    status VARCHAR(50) DEFAULT 'active',
    cart_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) DEFAULT 'Cái',
    image VARCHAR(255),
    images JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100),
    new_price DOUBLE PRECISION DEFAULT 0,
    old_price DOUBLE PRECISION DEFAULT 0,
    available BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    stock_quantity INTEGER DEFAULT 0,
    current_import_price DOUBLE PRECISION DEFAULT 0,
    profit_margin DOUBLE PRECISION DEFAULT 0,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    total DOUBLE PRECISION NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address JSONB,
    shipping_method VARCHAR(255),
    payment_method VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER,
    name VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DOUBLE PRECISION NOT NULL DEFAULT 0,
    size VARCHAR(50),
    image VARCHAR(255),
    code VARCHAR(50),
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_receipts (
    id SERIAL PRIMARY KEY,
    receipt_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS import_receipt_details (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES import_receipts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    import_price DOUBLE PRECISION NOT NULL,
    quantity INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
SQL);
    }

    private function alignLegacySchema(PDO $pdo): void
    {
        $pdo->exec(<<<'SQL'
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS cart_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'Cái',
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_import_price DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS profit_margin DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_address JSONB,
    ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS size VARCHAR(50),
    ADD COLUMN IF NOT EXISTS image VARCHAR(255),
    ADD COLUMN IF NOT EXISTS code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'orders'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE orders DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    END LOOP;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'products'::regclass
          AND conname = 'products_code_unique'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_code_unique UNIQUE (code);
    END IF;
END $$;

UPDATE users SET role = COALESCE(role, 'customer');
UPDATE users SET status = COALESCE(status, 'active');

UPDATE products
SET images = CASE
        WHEN images IS NULL THEN CASE WHEN image IS NOT NULL THEN jsonb_build_array(image) ELSE '[]'::jsonb END
        WHEN jsonb_typeof(images) <> 'array' THEN '[]'::jsonb
        ELSE images
    END,
    image = CASE
        WHEN image IS NULL AND images IS NOT NULL AND jsonb_typeof(images) = 'array' AND jsonb_array_length(images) > 0 THEN images->>0
        ELSE image
    END,
    status = COALESCE(status, 'active'),
    stock_quantity = COALESCE(stock_quantity, 0),
    current_import_price = COALESCE(current_import_price, 0),
    profit_margin = COALESCE(profit_margin, 0),
    unit = COALESCE(unit, 'Cái');
SQL);
    }

    private function ensureDefaultAdmin(PDO $pdo): void
    {
        $adminEmail = strtolower((string) getenv('ADMIN_EMAIL') ?: 'admin@clothify.com');
        $adminName = (string) getenv('ADMIN_NAME') ?: 'Clothify Admin';
        $adminPassword = (string) getenv('ADMIN_PASSWORD') ?: 'Admin@123';

        $statement = $pdo->prepare('SELECT id, role FROM users WHERE email = :email LIMIT 1');
        $statement->execute(['email' => $adminEmail]);
        $existing = $statement->fetch();

        if ($existing === false) {
            $insert = $pdo->prepare(
                'INSERT INTO users (name, email, password, status, role) VALUES (:name, :email, :password, :status, :role)'
            );
            $insert->execute([
                'name' => $adminName,
                'email' => $adminEmail,
                'password' => password_hash($adminPassword, PASSWORD_BCRYPT),
                'status' => 'active',
                'role' => 'admin',
            ]);

            return;
        }

        if (($existing['role'] ?? 'customer') !== 'admin') {
            $update = $pdo->prepare('UPDATE users SET role = :role, status = :status WHERE email = :email');
            $update->execute([
                'role' => 'admin',
                'status' => 'active',
                'email' => $adminEmail,
            ]);
        }
    }
}
