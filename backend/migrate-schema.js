// migrate-schema.js
const { Pool } = require('pg');

// !!! SỬA NẾU CẦN: config PostgreSQL (giống y như backend mới)
const pgPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'clothify', // đúng tên DB bạn tạo
    password: 'kt123456', // mật khẩu postgres của bạn
    port: 5432,
});

async function main() {
    console.log('Connecting to PostgreSQL...');
    const client = await pgPool.connect();
    console.log('✓ PostgreSQL connected');

    try {
        console.log('Altering orders table...');

        await client.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS shipping_address JSONB,
            ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(255),
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255);
        `);

        console.log('✓ `orders` table altered successfully.');

    } catch (err) {
        console.error('\nError during schema migration:', err);
    } finally {
        client.release();
        await pgPool.end();
        console.log('PostgreSQL connection closed.');
        process.exit(0);
    }
}

main();
