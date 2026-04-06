-- Canonical PostgreSQL schema for the PHP backend runtime.
-- The app auto-creates and aligns this schema at startup,
-- but keeping it in-repo makes rollback/manual setup easier.

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
