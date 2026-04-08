<?php

declare(strict_types=1);

namespace ClothifyPhp;

use PDO;
use Throwable;

final class Application
{
    private bool $schemaReady = false;
    private readonly string $jwtSecret;
    private readonly string $defaultAdminEmail;
    private readonly string $uploadDirectory;
    private readonly string $databaseDriver;

    public function __construct(
        private readonly PDO $pdo,
        private readonly SchemaManager $schemaManager,
        private readonly string $basePath
    ) {
        $this->jwtSecret = (string) getenv('JWT_SECRET') ?: 'secret_ecom';
        $this->defaultAdminEmail = strtolower((string) getenv('ADMIN_EMAIL') ?: 'admin@clothify.com');
        $this->uploadDirectory = $this->basePath
            . DIRECTORY_SEPARATOR . 'storage'
            . DIRECTORY_SEPARATOR . 'upload'
            . DIRECTORY_SEPARATOR . 'images';
        $this->databaseDriver = (string) $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    }

    public function handle(): void
    {
        $this->sendCorsHeaders();

        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method === 'OPTIONS') {
            http_response_code(204);
            return;
        }

        $path = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));

        try {
            $this->dispatch($method, $path);
        } catch (HttpException $exception) {
            $payload = $exception->payload();
            if (is_string($payload)) {
                $this->respondText($payload, $exception->statusCode());
                return;
            }

            $this->respondJson($payload, $exception->statusCode());
        } catch (Throwable $throwable) {
            $this->respondJson(
                [
                    'success' => false,
                    'message' => 'Internal server error.',
                    'detail' => $throwable->getMessage(),
                ],
                500
            );
        }
    }

    private function dispatch(string $method, string $path): void
    {
        if ($method === 'GET' && $path === '/') {
            $label = $this->isMySql() ? 'MySQL' : 'PostgreSQL';
            $this->respondText('PHP App is running with ' . $label, 200);
            return;
        }

        if ($method === 'POST' && $path === '/upload') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->handleUpload();
            return;
        }

        if ($method === 'POST' && $path === '/addproduct') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->addProduct();
            return;
        }

        if ($method === 'POST' && $path === '/removeproduct') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->removeProduct();
            return;
        }

        if ($method === 'PUT' && preg_match('#^/product/(\\d+)$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->updateProduct((int) $matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/allproducts') {
            $this->ensureSchemaReady();
            $this->getAllProducts();
            return;
        }

        if ($method === 'POST' && $path === '/register') {
            $this->ensureSchemaReady();
            $this->registerUser();
            return;
        }

        if ($method === 'POST' && $path === '/login') {
            $this->ensureSchemaReady();
            $this->loginUser();
            return;
        }

        if ($method === 'GET' && $path === '/users') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->listUsers();
            return;
        }

        if ($method === 'PATCH' && preg_match('#^/users/(\\d+)/status$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->updateUserStatus((int) $matches[1]);
            return;
        }

        if ($method === 'PATCH' && preg_match('#^/users/(\\d+)/role$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->updateUserRole((int) $matches[1]);
            return;
        }

        if ($method === 'POST' && $path === '/addtocart') {
            $this->ensureSchemaReady();
            $this->addToCart();
            return;
        }

        if ($method === 'POST' && $path === '/removefromcart') {
            $this->ensureSchemaReady();
            $this->removeFromCart();
            return;
        }

        if ($method === 'GET' && $path === '/cart') {
            $this->ensureSchemaReady();
            $this->getCart();
            return;
        }

        if ($method === 'PUT' && $path === '/cart') {
            $this->ensureSchemaReady();
            $this->replaceCart();
            return;
        }

        if ($method === 'GET' && $path === '/my-orders') {
            $this->ensureSchemaReady();
            $this->getMyOrders();
            return;
        }

        if ($method === 'GET' && preg_match('#^/order/(\\d+)$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->getOrderDetail((int) $matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/orders') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->getOrders();
            return;
        }

        if ($method === 'POST' && $path === '/orders') {
            $this->ensureSchemaReady();
            $this->createOrder();
            return;
        }

        if ($method === 'PATCH' && preg_match('#^/orders/(\\d+)$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->updateOrderStatus((int) $matches[1]);
            return;
        }

        if ($method === 'POST' && $path === '/addreview') {
            $this->ensureSchemaReady();
            $this->addReview();
            return;
        }

        if ($method === 'GET' && preg_match('#^/reviews/(\\d+)$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->getReviews((int) $matches[1]);
            return;
        }

        if ($method === 'GET' && $path === '/import-receipts') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->getImportReceipts();
            return;
        }

        if ($method === 'POST' && $path === '/import-receipts') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->createImportReceipt();
            return;
        }

        if ($method === 'POST' && preg_match('#^/import-receipts/(\\d+)/complete$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->completeImportReceipt((int) $matches[1]);
            return;
        }

        if ($method === 'GET' && preg_match('#^/import-receipts/(\\d+)$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->getImportReceipt((int) $matches[1]);
            return;
        }

        if ($method === 'PUT' && preg_match('#^/import-receipts/(\\d+)$#', $path, $matches) === 1) {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->updateImportReceipt((int) $matches[1]);
            return;
        }

        if ($method === 'PUT' && $path === '/update-profit-margin') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->updateProfitMargin();
            return;
        }

        if ($method === 'GET' && $path === '/api/reports/stock-at-time') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->getStockAtTime();
            return;
        }

        if ($method === 'GET' && $path === '/api/reports/import-export') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->getImportExportReport();
            return;
        }

        if ($method === 'GET' && $path === '/api/reports/low-stock') {
            $this->ensureSchemaReady();
            $this->requireAdminAuth();
            $this->getLowStockReport();
            return;
        }

        throw new HttpException(404, ['success' => false, 'message' => 'Route not found.']);
    }

    private function ensureSchemaReady(): void
    {
        if ($this->schemaReady) {
            return;
        }

        $this->schemaManager->ensureReady($this->pdo);
        $this->schemaReady = true;
    }

    private function handleUpload(): void
    {
        if (!isset($_FILES['product'])) {
            throw new HttpException(400, ['success' => false, 'message' => 'Missing upload file.']);
        }

        $file = $_FILES['product'];
        if (!is_array($file)) {
            throw new HttpException(400, ['success' => false, 'message' => 'Invalid upload payload.']);
        }

        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new HttpException(400, ['success' => false, 'message' => 'Upload failed.']);
        }

        $originalName = (string) ($file['name'] ?? '');
        $extension = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($extension, $allowedExtensions, true)) {
            throw new HttpException(400, ['success' => false, 'message' => 'Unsupported file type.']);
        }

        if (!is_dir($this->uploadDirectory) && !mkdir($this->uploadDirectory, 0777, true) && !is_dir($this->uploadDirectory)) {
            throw new HttpException(500, ['success' => false, 'message' => 'Unable to prepare upload directory.']);
        }

        $filename = sprintf('product_%s.%s', (string) round(microtime(true) * 1000), $extension);
        $target = $this->uploadDirectory . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file((string) $file['tmp_name'], $target)) {
            throw new HttpException(500, ['success' => false, 'message' => 'Unable to save uploaded file.']);
        }

        $this->respondJson([
            'success' => 1,
            'image_url' => 'images/' . $filename,
        ]);
    }

    private function addProduct(): void
    {
        $body = $this->requestJson();
        $images = $this->normalizeImages($body['images'] ?? []);
        $primaryImage = $images[0] ?? trim((string) ($body['image'] ?? ''));

        $code = trim((string) ($body['code'] ?? ''));
        $name = trim((string) ($body['name'] ?? ''));
        $category = trim((string) ($body['category'] ?? ''));

        if ($code === '' || $name === '' || $category === '' || $primaryImage === '') {
            throw new HttpException(400, ['success' => false, 'message' => 'Thiếu thông tin bắt buộc (Mã, Tên, Ảnh, Danh mục).']);
        }

        $stock = $this->toInt($body['initial_stock'] ?? 0);
        $importPrice = $this->toFloat($body['import_price'] ?? 0);
        $profitMargin = $this->toFloat($body['profit_margin'] ?? 0);
        $oldPrice = $this->toFloat($body['old_price'] ?? 0);
        $newPrice = $importPrice * (1 + ($profitMargin / 100));
        $imagesToSave = $images !== [] ? $images : [$primaryImage];

        $imagesExpression = $this->isMySql() ? ':images' : 'CAST(:images AS jsonb)';
        $sql = <<<SQL
INSERT INTO products
    (code, name, description, unit, category, stock_quantity, initial_stock_quantity, current_import_price, profit_margin, new_price, old_price, status, image, images)
VALUES
    (:code, :name, :description, :unit, :category, :stock_quantity, :initial_stock_quantity, :current_import_price, :profit_margin, :new_price, :old_price, :status, :image, {$imagesExpression})
SQL;

        if (!$this->isMySql()) {
            $sql .= "\nRETURNING *";
        }

        $statement = $this->pdo->prepare($sql);

        try {
            $statement->execute([
                'code' => $code,
                'name' => $name,
                'description' => trim((string) ($body['description'] ?? '')),
                'unit' => trim((string) ($body['unit'] ?? '')) !== '' ? trim((string) $body['unit']) : 'Cái',
                'category' => $category,
                'stock_quantity' => $stock,
                'initial_stock_quantity' => $stock,
                'current_import_price' => $importPrice,
                'profit_margin' => $profitMargin,
                'new_price' => $newPrice,
                'old_price' => $oldPrice,
                'status' => trim((string) ($body['status'] ?? '')) !== '' ? trim((string) $body['status']) : 'active',
                'image' => $primaryImage,
                'images' => $this->jsonEncode($imagesToSave),
            ]);
        } catch (Throwable $throwable) {
            if ($this->isUniqueConstraintViolation($throwable)) {
                throw new HttpException(400, ['success' => false, 'message' => 'Mã sản phẩm đã tồn tại!']);
            }

            throw $throwable;
        }

        $product = $this->isMySql()
            ? $this->fetchOne('SELECT * FROM products WHERE id = :id LIMIT 1', ['id' => (int) $this->pdo->lastInsertId()])
            : ($statement->fetch() ?: null);

        $this->respondJson([
            'success' => true,
            'product' => $product,
        ]);
    }

    private function removeProduct(): void
    {
        $body = $this->requestJson();
        $id = $this->toInt($body['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(400, ['success' => false, 'message' => 'Product id is required.']);
        }

        $product = $this->fetchOne('SELECT * FROM products WHERE id = :id', ['id' => $id]);
        if ($product === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'Product not found.']);
        }

        $hasHistory = (bool) $this->fetchValue(
            <<<'SQL'
SELECT EXISTS (
    SELECT 1 FROM import_receipt_details WHERE product_id = :id
) OR EXISTS (
    SELECT 1 FROM order_items WHERE product_id = :id
) OR EXISTS (
    SELECT 1 FROM reviews WHERE product_id = :id
)
SQL,
            ['id' => $id]
        );

        if ($hasHistory || $this->toInt($product['stock_quantity'] ?? 0) > 0) {
            $statement = $this->pdo->prepare(
                $this->isMySql()
                    ? 'UPDATE products SET status = :status WHERE id = :id'
                    : 'UPDATE products SET status = :status WHERE id = :id RETURNING *'
            );
            $statement->execute([
                'status' => 'hidden',
                'id' => $id,
            ]);

            $updatedProduct = $this->isMySql()
                ? $this->fetchOne('SELECT * FROM products WHERE id = :id LIMIT 1', ['id' => $id])
                : ($statement->fetch() ?: null);

            $this->respondJson([
                'success' => true,
                'action' => 'hidden',
                'product' => $updatedProduct,
            ]);
            return;
        }

        $deletedProduct = $product;
        $statement = $this->pdo->prepare(
            $this->isMySql()
                ? 'DELETE FROM products WHERE id = :id'
                : 'DELETE FROM products WHERE id = :id RETURNING *'
        );
        $statement->execute(['id' => $id]);

        if (!$this->isMySql()) {
            $deletedProduct = $statement->fetch() ?: $deletedProduct;
        }

        $this->respondJson([
            'success' => true,
            'action' => 'deleted',
            'product' => $deletedProduct,
        ]);
    }

    private function updateProduct(int $id): void
    {
        $body = $this->requestJson();
        $existing = $this->fetchOne('SELECT current_import_price FROM products WHERE id = :id', ['id' => $id]);
        if ($existing === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'Sản phẩm không tồn tại.']);
        }

        $updates = [];
        $params = ['id' => $id];
        $fieldMap = [
            'code' => 'code',
            'name' => 'name',
            'description' => 'description',
            'unit' => 'unit',
            'category' => 'category',
            'status' => 'status',
        ];

        foreach ($fieldMap as $inputField => $columnName) {
            if (array_key_exists($inputField, $body)) {
                $updates[] = sprintf('%s = :%s', $columnName, $inputField);
                $params[$inputField] = $body[$inputField];
            }
        }

        if (array_key_exists('old_price', $body)) {
            $updates[] = 'old_price = :old_price';
            $params['old_price'] = $this->toFloat($body['old_price']);
        }

        if (array_key_exists('profit_margin', $body)) {
            $profitMargin = $this->toFloat($body['profit_margin']);
            $newPrice = $this->toFloat($existing['current_import_price'] ?? 0) * (1 + ($profitMargin / 100));
            $updates[] = 'profit_margin = :profit_margin';
            $updates[] = 'new_price = :new_price';
            $params['profit_margin'] = $profitMargin;
            $params['new_price'] = $newPrice;
        }

        if (array_key_exists('images', $body)) {
            $images = $this->normalizeImages($body['images']);
            $updates[] = $this->isMySql() ? 'images = :images' : 'images = CAST(:images AS jsonb)';
            $updates[] = 'image = :image';
            $params['images'] = $this->jsonEncode($images);
            $params['image'] = $images[0] ?? '';
        }

        if ($updates === []) {
            throw new HttpException(400, ['success' => false, 'message' => 'Không có dữ liệu cập nhật.']);
        }

        $sql = 'UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = :id';
        if (!$this->isMySql()) {
            $sql .= ' RETURNING *';
        }

        $statement = $this->pdo->prepare($sql);

        try {
            $statement->execute($params);
        } catch (Throwable $throwable) {
            if ($this->isUniqueConstraintViolation($throwable)) {
                throw new HttpException(400, ['success' => false, 'message' => 'Mã sản phẩm đã tồn tại!']);
            }

            throw $throwable;
        }

        $product = $this->isMySql()
            ? $this->fetchOne('SELECT * FROM products WHERE id = :id LIMIT 1', ['id' => $id])
            : ($statement->fetch() ?: null);

        $this->respondJson([
            'success' => true,
            'product' => $product,
        ]);
    }

    private function getAllProducts(): void
    {
        $statement = $this->pdo->query('SELECT * FROM products ORDER BY date DESC, id DESC');
        $this->respondJson($statement->fetchAll());
    }

    private function registerUser(): void
    {
        $body = $this->requestJson();
        $name = trim((string) ($body['name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        if ($name === '' || $email === '' || $password === '') {
            throw new HttpException(400, ['success' => false, 'message' => 'Missing required registration fields.']);
        }

        $existing = $this->fetchValue('SELECT id FROM users WHERE email = :email LIMIT 1', ['email' => $email]);
        if ($existing !== false && $existing !== null) {
            throw new HttpException(400, ['success' => false, 'message' => 'Email already registered.']);
        }

        $sql = <<<'SQL'
INSERT INTO users (name, email, password, role)
VALUES (:name, :email, :password, 'customer')
SQL;

        if (!$this->isMySql()) {
            $sql .= "\nRETURNING id, name, email, status, role, created_at";
        }

        $statement = $this->pdo->prepare($sql);
        $statement->execute([
            'name' => $name,
            'email' => $email,
            'password' => password_hash($password, PASSWORD_BCRYPT),
        ]);

        $user = $this->isMySql()
            ? $this->fetchOne(
                'SELECT id, name, email, status, role, created_at FROM users WHERE id = :id LIMIT 1',
                ['id' => (int) $this->pdo->lastInsertId()]
            )
            : ($statement->fetch() ?: null);
        $token = Jwt::encode(['id' => (int) $user['id'], 'email' => $user['email']], $this->jwtSecret);

        $this->respondJson([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'status' => $user['status'],
                'role' => $user['role'] ?? 'customer',
                'createdAt' => $user['created_at'],
            ],
        ]);
    }

    private function loginUser(): void
    {
        $body = $this->requestJson();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        if ($email === '' || $password === '') {
            throw new HttpException(400, ['success' => false, 'message' => 'Missing login credentials.']);
        }

        $user = $this->fetchOne('SELECT * FROM users WHERE email = :email LIMIT 1', ['email' => $email]);
        if ($user === null || !password_verify($password, (string) ($user['password'] ?? ''))) {
            throw new HttpException(401, ['success' => false, 'message' => 'Invalid email or password.']);
        }

        if (($user['status'] ?? 'active') === 'suspended') {
            throw new HttpException(403, ['success' => false, 'message' => 'Account is suspended.']);
        }

        $token = Jwt::encode(['id' => (int) $user['id'], 'email' => $user['email']], $this->jwtSecret);

        $this->respondJson([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'status' => $user['status'],
                'role' => $user['role'] ?? 'customer',
                'createdAt' => $user['created_at'],
            ],
        ]);
    }

    private function listUsers(): void
    {
        $statement = $this->pdo->query(
            'SELECT id, name, email, status, role, created_at FROM users ORDER BY created_at DESC'
        );

        $users = array_map(
            static fn(array $user): array => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'status' => $user['status'],
                'role' => $user['role'] ?? 'customer',
                'createdAt' => $user['created_at'],
            ],
            $statement->fetchAll()
        );

        $this->respondJson([
            'success' => true,
            'users' => $users,
        ]);
    }

    private function updateUserStatus(int $userId): void
    {
        $body = $this->requestJson();
        $status = strtolower(trim((string) ($body['status'] ?? '')));
        if (!in_array($status, ['active', 'suspended'], true)) {
            throw new HttpException(400, ['success' => false, 'message' => 'Invalid user status.']);
        }

        $existing = $this->fetchOne('SELECT id, email FROM users WHERE id = :id LIMIT 1', ['id' => $userId]);
        if ($existing === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'User not found.']);
        }

        if (strtolower((string) ($existing['email'] ?? '')) === $this->defaultAdminEmail && $status !== 'active') {
            throw new HttpException(400, ['success' => false, 'message' => 'Cannot suspend the default administrator account.']);
        }

        $sql = <<<'SQL'
UPDATE users
SET status = :status
WHERE id = :id
SQL;

        if (!$this->isMySql()) {
            $sql .= "\nRETURNING id, name, email, status, created_at";
        }

        $statement = $this->pdo->prepare($sql);
        $statement->execute([
            'status' => $status,
            'id' => $userId,
        ]);

        $user = $this->isMySql()
            ? $this->fetchOne('SELECT id, name, email, status, created_at FROM users WHERE id = :id LIMIT 1', ['id' => $userId])
            : ($statement->fetch() ?: null);
        $this->respondJson([
            'success' => true,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'status' => $user['status'],
                'createdAt' => $user['created_at'],
            ],
        ]);
    }

    private function updateUserRole(int $userId): void
    {
        $body = $this->requestJson();
        $role = strtolower(trim((string) ($body['role'] ?? '')));
        if (!in_array($role, ['customer', 'admin'], true)) {
            throw new HttpException(400, ['success' => false, 'message' => 'Invalid user role.']);
        }

        $existing = $this->fetchOne(
            'SELECT id, name, email, status, role, created_at FROM users WHERE id = :id LIMIT 1',
            ['id' => $userId]
        );
        if ($existing === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'User not found.']);
        }

        if (strtolower((string) ($existing['email'] ?? '')) === $this->defaultAdminEmail && $role !== 'admin') {
            throw new HttpException(400, ['success' => false, 'message' => 'Cannot remove admin role from the default administrator account.']);
        }

        $sql = <<<'SQL'
UPDATE users
SET role = :role
WHERE id = :id
SQL;

        if (!$this->isMySql()) {
            $sql .= "\nRETURNING id, name, email, status, role, created_at";
        }

        $statement = $this->pdo->prepare($sql);
        $statement->execute([
            'role' => $role,
            'id' => $userId,
        ]);

        $user = $this->isMySql()
            ? $this->fetchOne(
                'SELECT id, name, email, status, role, created_at FROM users WHERE id = :id LIMIT 1',
                ['id' => $userId]
            )
            : ($statement->fetch() ?: null);
        $this->respondJson([
            'success' => true,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'status' => $user['status'],
                'role' => $user['role'] ?? 'customer',
                'createdAt' => $user['created_at'],
            ],
        ]);
    }

    private function addToCart(): void
    {
        $user = $this->requireAuthTokenHeader();
        $body = $this->requestJson();
        $itemId = $this->toInt($body['itemId'] ?? 0);
        $size = trim((string) ($body['size'] ?? ''));

        if ($itemId <= 0 || $size === '') {
            throw new HttpException(400, ['error' => 'Size is required']);
        }

        $userRow = $this->fetchOne('SELECT id, cart_data FROM users WHERE id = :id LIMIT 1', ['id' => $user['id']]);
        if ($userRow === null) {
            throw new HttpException(404, ['error' => 'User not found']);
        }

        $cartData = $this->decodeJsonColumn($userRow['cart_data'] ?? []) ?? [];
        $key = $itemId . '-' . $size;
        $cartData[$key] = $this->toInt($cartData[$key] ?? 0) + 1;

        $statement = $this->pdo->prepare(
            $this->isMySql()
                ? 'UPDATE users SET cart_data = :cart_data WHERE id = :id'
                : 'UPDATE users SET cart_data = CAST(:cart_data AS jsonb) WHERE id = :id'
        );
        $statement->execute([
            'cart_data' => $this->jsonEncode($cartData),
            'id' => $user['id'],
        ]);

        $this->respondText('Added', 200);
    }

    private function removeFromCart(): void
    {
        $user = $this->requireAuthTokenHeader();
        $body = $this->requestJson();
        $itemId = $this->toInt($body['itemId'] ?? 0);
        $size = trim((string) ($body['size'] ?? ''));

        $userRow = $this->fetchOne('SELECT id, cart_data FROM users WHERE id = :id LIMIT 1', ['id' => $user['id']]);
        if ($userRow === null) {
            throw new HttpException(404, ['error' => 'User not found']);
        }

        $cartData = $this->decodeJsonColumn($userRow['cart_data'] ?? []) ?? [];
        $key = $itemId . '-' . $size;

        if (isset($cartData[$key])) {
            $cartData[$key] = $this->toInt($cartData[$key]) - 1;
            if ($cartData[$key] <= 0) {
                unset($cartData[$key]);
            }
        }

        $statement = $this->pdo->prepare(
            $this->isMySql()
                ? 'UPDATE users SET cart_data = :cart_data WHERE id = :id'
                : 'UPDATE users SET cart_data = CAST(:cart_data AS jsonb) WHERE id = :id'
        );
        $statement->execute([
            'cart_data' => $this->jsonEncode($cartData),
            'id' => $user['id'],
        ]);

        $this->respondText('Removed', 200);
    }

    private function getCart(): void
    {
        $user = $this->requireBearerAuth();
        $userRow = $this->fetchOne('SELECT id, cart_data FROM users WHERE id = :id LIMIT 1', ['id' => $user['id']]);
        if ($userRow === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'User not found.']);
        }

        $cartItems = $this->sanitizeCartItems($this->decodeJsonColumn($userRow['cart_data'] ?? []) ?? []);

        $this->respondJson([
            'success' => true,
            'cartItems' => $cartItems,
        ]);
    }

    private function replaceCart(): void
    {
        $user = $this->requireBearerAuth();
        $body = $this->requestJson();
        $cartItems = $this->sanitizeCartItems($body['cartItems'] ?? []);

        $statement = $this->pdo->prepare(
            $this->isMySql()
                ? 'UPDATE users SET cart_data = :cart_data WHERE id = :id'
                : 'UPDATE users SET cart_data = CAST(:cart_data AS jsonb) WHERE id = :id'
        );
        $statement->execute([
            'cart_data' => $this->jsonEncode($cartItems),
            'id' => $user['id'],
        ]);

        $this->respondJson([
            'success' => true,
            'cartItems' => $cartItems,
        ]);
    }

    private function getMyOrders(): void
    {
        $user = $this->requireBearerAuth();

        $statement = $this->pdo->prepare(
            <<<'SQL'
SELECT o.id, o.order_id, o.status, o.total, o.created_at
FROM orders o
WHERE o.customer_id = :customer_id
ORDER BY o.created_at DESC
SQL
        );
        $statement->execute(['customer_id' => $user['id']]);
        $orders = $statement->fetchAll();

        if ($orders === []) {
            $this->respondJson([]);
            return;
        }

        $itemsByOrderId = $this->fetchOrderItemsByParentIds(array_map(
            static fn(array $order): int => (int) $order['id'],
            $orders
        ));

        $response = array_map(function (array $order) use ($itemsByOrderId): array {
            $items = $itemsByOrderId[(int) $order['id']] ?? [];

            return [
                'id' => (int) $order['order_id'],
                'created_at' => $order['created_at'],
                'status' => $order['status'],
                'total_amount' => $this->toFloat($order['total']),
                'items' => array_map(
                    fn(array $item): array => [
                        'id' => (int) $item['id'],
                        'name' => $item['name'],
                        'quantity' => $this->toInt($item['quantity']),
                        'price' => $this->toFloat($item['price']),
                        'image' => $item['resolved_image'] ?? '',
                    ],
                    $items
                ),
            ];
        }, $orders);

        $this->respondJson($response);
    }

    private function getOrderDetail(int $orderId): void
    {
        $user = $this->requireBearerAuth();

        $statement = $this->pdo->prepare(
            <<<'SQL'
SELECT o.id, o.order_id, o.status, o.total, o.created_at, o.shipping_address, o.shipping_method, o.payment_method
FROM orders o
WHERE o.order_id = :order_id AND o.customer_id = :customer_id
LIMIT 1
SQL
        );
        $statement->execute([
            'order_id' => $orderId,
            'customer_id' => $user['id'],
        ]);
        $order = $statement->fetch();

        if ($order === false) {
            throw new HttpException(404, ['success' => false, 'message' => 'Order not found.']);
        }

        $items = $this->fetchOrderItemsByParentIds([(int) $order['id']])[(int) $order['id']] ?? [];

        $this->respondJson([
            'id' => (int) $order['order_id'],
            'created_at' => $order['created_at'],
            'status' => $order['status'],
            'total_amount' => $this->toFloat($order['total']),
            'shipping_address' => $this->decodeJsonColumn($order['shipping_address'] ?? null),
            'shipping_method' => $order['shipping_method'],
            'payment_method' => $order['payment_method'],
            'shipping_fee' => 0,
            'tax' => 0,
            'items' => array_map(fn(array $item): array => [
                'id' => (int) $item['id'],
                'productId' => $item['product_id'] !== null ? (int) $item['product_id'] : null,
                'name' => $item['name'],
                'quantity' => $this->toInt($item['quantity']),
                'price' => $this->toFloat($item['price']),
                'image' => $item['resolved_image'] ?? '',
                'code' => $item['resolved_code'] ?? null,
                'unit' => $item['resolved_unit'] ?? 'Cái',
                'size' => $item['size'] ?? null,
            ], $items),
        ]);
    }

    private function getOrders(): void
    {
        $statement = $this->pdo->query(
            <<<'SQL'
SELECT o.*, u.name AS user_name, u.email AS user_email, u.status AS user_status
FROM orders o
LEFT JOIN users u ON o.customer_id = u.id
ORDER BY o.created_at DESC
SQL
        );
        $orders = $statement->fetchAll();

        if ($orders === []) {
            $this->respondJson(['success' => true, 'orders' => []]);
            return;
        }

        $itemsByOrderId = $this->fetchOrderItemsByParentIds(array_map(
            static fn(array $order): int => (int) $order['id'],
            $orders
        ));

        $formatted = array_map(
            fn(array $order): array => $this->formatOrderResponse($order, $itemsByOrderId[(int) $order['id']] ?? []),
            $orders
        );

        $this->respondJson([
            'success' => true,
            'orders' => $formatted,
        ]);
    }

    private function createOrder(): void
    {
        $body = $this->requestJson();
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];
        $status = strtolower(trim((string) ($body['status'] ?? 'pending')));
        $allowedStatuses = ['pending', 'processing', 'shipped', 'confirmed', 'delivered', 'cancelled'];

        if (!in_array($status, $allowedStatuses, true)) {
            $status = 'pending';
        }

        if ($items === []) {
            throw new HttpException(400, ['success' => false, 'message' => 'Order must contain at least one item.']);
        }

        $this->pdo->beginTransaction();

        try {
            $nextOrderId = $this->toInt($this->fetchValue('SELECT COALESCE(MAX(order_id), 0) + 1 FROM orders'));
            if ($nextOrderId <= 0) {
                $nextOrderId = 1;
            }

            $shippingAddress = [
                'name' => trim((string) ($body['customerName'] ?? '')),
                'email' => trim((string) ($body['customerEmail'] ?? '')),
                'phone' => trim((string) ($body['customerPhone'] ?? '')) !== '' ? trim((string) $body['customerPhone']) : 'Chưa cập nhật',
                'address' => trim((string) ($body['shippingAddress'] ?? '')),
            ];

            $shippingExpression = $this->isMySql() ? ':shipping_address' : 'CAST(:shipping_address AS jsonb)';
            $sql = <<<SQL
INSERT INTO orders
    (order_id, customer_id, customer_name, customer_email, total, status, shipping_address, shipping_method, payment_method)
VALUES
    (:order_id, :customer_id, :customer_name, :customer_email, :total, :status, {$shippingExpression}, :shipping_method, :payment_method)
SQL;

            if (!$this->isMySql()) {
                $sql .= "\nRETURNING *";
            }

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                'order_id' => $nextOrderId,
                'customer_id' => array_key_exists('customerId', $body) && $body['customerId'] !== null
                    ? $this->toInt($body['customerId'])
                    : null,
                'customer_name' => trim((string) ($body['customerName'] ?? '')),
                'customer_email' => trim((string) ($body['customerEmail'] ?? '')),
                'total' => $this->toFloat($body['total'] ?? 0),
                'status' => $status,
                'shipping_address' => $this->jsonEncode($shippingAddress),
                'shipping_method' => 'Giao hàng tiêu chuẩn',
                'payment_method' => trim((string) ($body['paymentMethod'] ?? '')),
            ]);

            $order = $this->isMySql()
                ? $this->fetchOne('SELECT * FROM orders WHERE id = :id LIMIT 1', ['id' => (int) $this->pdo->lastInsertId()])
                : ($statement->fetch() ?: null);
            $orderPrimaryId = (int) $order['id'];

            $insertItem = $this->pdo->prepare(
                <<<'SQL'
INSERT INTO order_items
    (order_id, product_id, name, quantity, price, size, image, code, unit)
VALUES
    (:order_id, :product_id, :name, :quantity, :price, :size, :image, :code, :unit)
SQL
            );

            $inventoryShouldChange = $this->isInventoryAffectingOrderStatus($status);
            $normalizedItems = [];

            foreach ($items as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $quantity = $this->toInt($item['quantity'] ?? 0);
                if ($quantity <= 0) {
                    continue;
                }

                $productId = $this->toInt($item['productId'] ?? 0);
                $snapshot = null;

                if ($productId > 0) {
                    $snapshot = $this->fetchOne(
                        'SELECT id, name, code, unit, status, stock_quantity, ' . $this->productPrimaryImageExpression() . ' AS image FROM products WHERE id = :id LIMIT 1 FOR UPDATE',
                        ['id' => $productId]
                    );

                    if ($snapshot === null) {
                        throw new HttpException(404, ['success' => false, 'message' => 'Product not found for this order item.']);
                    }

                    if ($inventoryShouldChange && $this->toInt($snapshot['stock_quantity'] ?? 0) < $quantity) {
                        throw new HttpException(400, [
                            'success' => false,
                            'message' => sprintf('Insufficient stock for product "%s".', (string) ($snapshot['name'] ?? $item['name'] ?? '')),
                        ]);
                    }

                    if ($inventoryShouldChange) {
                        $updateStock = $this->pdo->prepare('UPDATE products SET stock_quantity = :stock_quantity WHERE id = :id');
                        $updateStock->execute([
                            'stock_quantity' => max($this->toInt($snapshot['stock_quantity'] ?? 0) - $quantity, 0),
                            'id' => $productId,
                        ]);
                    }
                }

                $normalizedItem = [
                    'productId' => $productId,
                    'name' => trim((string) ($item['name'] ?? '')),
                    'quantity' => $quantity,
                    'price' => $this->toFloat($item['price'] ?? 0),
                    'size' => trim((string) ($item['size'] ?? '')) !== '' ? trim((string) $item['size']) : null,
                ];
                $normalizedItems[] = $normalizedItem;

                $insertItem->execute([
                    'order_id' => $orderPrimaryId,
                    'product_id' => $productId > 0 ? $productId : null,
                    'name' => $normalizedItem['name'],
                    'quantity' => $normalizedItem['quantity'],
                    'price' => $normalizedItem['price'],
                    'size' => $normalizedItem['size'],
                    'image' => $snapshot['image'] ?? null,
                    'code' => $snapshot['code'] ?? null,
                    'unit' => $snapshot['unit'] ?? 'Cái',
                ]);
            }

            if ($normalizedItems === []) {
                throw new HttpException(400, ['success' => false, 'message' => 'Order must contain at least one valid item.']);
            }

            $this->pdo->commit();

            $this->respondJson([
                'success' => true,
                'order' => [
                    'id' => (int) $order['id'],
                    'orderId' => (int) $order['order_id'],
                    'customerName' => $order['customer_name'],
                    'customerEmail' => $order['customer_email'],
                    'items' => array_map(fn(array $item): array => [
                        'productId' => $item['productId'],
                        'name' => $item['name'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'size' => $item['size'],
                    ], $normalizedItems),
                    'total' => $this->toFloat($order['total']),
                    'status' => $order['status'],
                    'shippingAddress' => $shippingAddress['address'],
                    'shippingMethod' => $order['shipping_method'],
                    'paymentMethod' => $order['payment_method'],
                ],
            ]);
        } catch (Throwable $throwable) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $throwable;
        }
    }

    private function updateOrderStatus(int $orderId): void
    {
        $body = $this->requestJson();
        $status = strtolower(trim((string) ($body['status'] ?? '')));
        $allowedStatuses = ['pending', 'processing', 'shipped', 'confirmed', 'delivered', 'cancelled'];

        if (!in_array($status, $allowedStatuses, true)) {
            throw new HttpException(400, ['success' => false, 'message' => 'Invalid order status.']);
        }

        $this->pdo->beginTransaction();

        try {
            $orderRow = $this->fetchOne(
                'SELECT id, status FROM orders WHERE order_id = :order_id LIMIT 1 FOR UPDATE',
                ['order_id' => $orderId]
            );

            if ($orderRow === null) {
                throw new HttpException(404, ['success' => false, 'message' => 'Order not found.']);
            }

            $orderPrimaryId = (int) $orderRow['id'];
            $previousStatus = strtolower((string) ($orderRow['status'] ?? 'pending'));
            $items = $this->fetchOrderItemsByParentIds([$orderPrimaryId])[$orderPrimaryId] ?? [];

            if ($previousStatus !== $status) {
                $wasAffectingInventory = $this->isInventoryAffectingOrderStatus($previousStatus);
                $isAffectingInventory = $this->isInventoryAffectingOrderStatus($status);

                if ($wasAffectingInventory !== $isAffectingInventory) {
                    $this->adjustInventoryForOrderItems($items, $isAffectingInventory ? 'deduct' : 'restore');
                }
            }

            $statement = $this->pdo->prepare('UPDATE orders SET status = :status WHERE order_id = :order_id');
            $statement->execute([
                'status' => $status,
                'order_id' => $orderId,
            ]);

            $order = $this->fetchOne(
                <<<'SQL'
SELECT o.*, u.name AS user_name, u.email AS user_email, u.status AS user_status
FROM orders o
LEFT JOIN users u ON o.customer_id = u.id
WHERE o.id = :id
LIMIT 1
SQL,
                ['id' => $orderPrimaryId]
            );

            $this->pdo->commit();

            $this->respondJson([
                'success' => true,
                'order' => $this->formatOrderResponse($order, $items),
            ]);
        } catch (Throwable $throwable) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $throwable;
        }
    }

    private function addReview(): void
    {
        $user = $this->requireAuthTokenHeader();
        $body = $this->requestJson();

        $sql = <<<'SQL'
INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
VALUES (:product_id, :user_id, :user_name, :rating, :comment)
SQL;

        if (!$this->isMySql()) {
            $sql .= "\nRETURNING *";
        }

        $statement = $this->pdo->prepare($sql);

        $userRow = $this->fetchOne('SELECT name FROM users WHERE id = :id LIMIT 1', ['id' => $user['id']]);
        if ($userRow === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'Người dùng không tồn tại']);
        }

        $statement->execute([
            'product_id' => $this->toInt($body['productId'] ?? 0),
            'user_id' => $user['id'],
            'user_name' => $userRow['name'],
            'rating' => max(1, min(5, $this->toInt($body['rating'] ?? 5))),
            'comment' => trim((string) ($body['comment'] ?? '')),
        ]);

        $review = $this->isMySql()
            ? $this->fetchOne('SELECT * FROM reviews WHERE id = :id LIMIT 1', ['id' => (int) $this->pdo->lastInsertId()])
            : ($statement->fetch() ?: null);

        $this->respondJson([
            'success' => true,
            'review' => $review,
        ]);
    }

    private function getReviews(int $productId): void
    {
        $statement = $this->pdo->prepare('SELECT * FROM reviews WHERE product_id = :product_id ORDER BY created_at DESC');
        $statement->execute(['product_id' => $productId]);

        $this->respondJson([
            'success' => true,
            'reviews' => $statement->fetchAll(),
        ]);
    }

    private function getImportReceipts(): void
    {
        $statement = $this->pdo->query('SELECT * FROM import_receipts ORDER BY created_at DESC');
        $this->respondJson([
            'success' => true,
            'receipts' => $statement->fetchAll(),
        ]);
    }

    private function createImportReceipt(): void
    {
        $body = $this->requestJson();
        $receiptCode = trim((string) ($body['receiptCode'] ?? ''));
        $details = is_array($body['details'] ?? null) ? $body['details'] : [];

        if ($receiptCode === '' || $details === []) {
            throw new HttpException(400, ['success' => false, 'message' => 'Thiếu thông tin phiếu nhập']);
        }

        $this->pdo->beginTransaction();

        try {
            $sql = 'INSERT INTO import_receipts (receipt_code, status) VALUES (:receipt_code, :status)';
            if (!$this->isMySql()) {
                $sql .= ' RETURNING *';
            }

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                'receipt_code' => $receiptCode,
                'status' => 'pending',
            ]);
            $receipt = $this->isMySql()
                ? $this->fetchOne('SELECT * FROM import_receipts WHERE id = :id LIMIT 1', ['id' => (int) $this->pdo->lastInsertId()])
                : ($statement->fetch() ?: null);

            $detailStatement = $this->pdo->prepare(
                'INSERT INTO import_receipt_details (receipt_id, product_id, import_price, quantity) VALUES (:receipt_id, :product_id, :import_price, :quantity)'
            );

            foreach ($details as $detail) {
                if (!is_array($detail)) {
                    continue;
                }

                $detailStatement->execute([
                    'receipt_id' => $receipt['id'],
                    'product_id' => $this->toInt($detail['productId'] ?? 0),
                    'import_price' => $this->toFloat($detail['importPrice'] ?? 0),
                    'quantity' => $this->toInt($detail['quantity'] ?? 0),
                ]);
            }

            $this->pdo->commit();
            $this->respondJson([
                'success' => true,
                'receipt' => $receipt,
            ]);
        } catch (Throwable $throwable) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $throwable;
        }
    }

    private function completeImportReceipt(int $receiptId): void
    {
        $this->pdo->beginTransaction();

        try {
            $receipt = $this->fetchOne('SELECT id, status FROM import_receipts WHERE id = :id LIMIT 1', ['id' => $receiptId]);
            if ($receipt === null) {
                throw new HttpException(404, ['success' => false, 'message' => 'Phiếu nhập không tồn tại']);
            }

            if (($receipt['status'] ?? '') === 'completed') {
                throw new HttpException(400, ['success' => false, 'message' => 'Phiếu này đã hoàn thành từ trước']);
            }

            $detailsStatement = $this->pdo->prepare('SELECT * FROM import_receipt_details WHERE receipt_id = :receipt_id');
            $detailsStatement->execute(['receipt_id' => $receiptId]);
            $details = $detailsStatement->fetchAll();

            foreach ($details as $detail) {
                $product = $this->fetchOne(
                    'SELECT stock_quantity, current_import_price, profit_margin FROM products WHERE id = :id LIMIT 1',
                    ['id' => $detail['product_id']]
                );
                if ($product === null) {
                    continue;
                }

                $currentStock = $this->toInt($product['stock_quantity'] ?? 0);
                $currentImportPrice = $this->toFloat($product['current_import_price'] ?? 0);
                $profitMargin = $this->toFloat($product['profit_margin'] ?? 0);
                $importQty = $this->toInt($detail['quantity'] ?? 0);
                $newImportPrice = $this->toFloat($detail['import_price'] ?? 0);

                if ($currentStock <= 0) {
                    $weightedAveragePrice = $newImportPrice;
                } else {
                    $weightedAveragePrice = (($currentStock * $currentImportPrice) + ($importQty * $newImportPrice)) / max(1, $currentStock + $importQty);
                }

                $newSellingPrice = $weightedAveragePrice * (1 + ($profitMargin / 100));

                $statement = $this->pdo->prepare(
                    <<<'SQL'
UPDATE products
SET stock_quantity = :stock_quantity,
    current_import_price = :current_import_price,
    new_price = :new_price,
    status = :status
WHERE id = :id
SQL
                );
                $statement->execute([
                    'stock_quantity' => $currentStock + $importQty,
                    'current_import_price' => $weightedAveragePrice,
                    'new_price' => $newSellingPrice,
                    'status' => 'active',
                    'id' => $detail['product_id'],
                ]);
            }

            $statement = $this->pdo->prepare('UPDATE import_receipts SET status = :status WHERE id = :id');
            $statement->execute([
                'status' => 'completed',
                'id' => $receiptId,
            ]);

            $this->pdo->commit();
            $this->respondJson([
                'success' => true,
                'message' => 'Hoàn thành phiếu nhập và cập nhật giá thành công!',
            ]);
        } catch (Throwable $throwable) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $throwable;
        }
    }

    private function getImportReceipt(int $receiptId): void
    {
        $receipt = $this->fetchOne('SELECT * FROM import_receipts WHERE id = :id LIMIT 1', ['id' => $receiptId]);
        if ($receipt === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'Không tìm thấy phiếu nhập']);
        }

        $statement = $this->pdo->prepare(
            <<<'SQL'
SELECT ird.*, p.name, p.code
FROM import_receipt_details ird
JOIN products p ON ird.product_id = p.id
WHERE ird.receipt_id = :receipt_id
SQL
        );
        $statement->execute(['receipt_id' => $receiptId]);

        $this->respondJson([
            'success' => true,
            'receipt' => $receipt,
            'details' => $statement->fetchAll(),
        ]);
    }

    private function updateImportReceipt(int $receiptId): void
    {
        $body = $this->requestJson();
        $receiptCode = trim((string) ($body['receiptCode'] ?? ''));
        $details = is_array($body['details'] ?? null) ? $body['details'] : [];

        $this->pdo->beginTransaction();

        try {
            $existing = $this->fetchOne('SELECT status FROM import_receipts WHERE id = :id LIMIT 1', ['id' => $receiptId]);
            if ($existing === null) {
                throw new HttpException(404, ['success' => false, 'message' => 'Phiếu không tồn tại']);
            }

            if (($existing['status'] ?? '') === 'completed') {
                throw new HttpException(400, ['success' => false, 'message' => 'Phiếu này đã hoàn thành, không thể sửa chữa!']);
            }

            $statement = $this->pdo->prepare('UPDATE import_receipts SET receipt_code = :receipt_code WHERE id = :id');
            $statement->execute([
                'receipt_code' => $receiptCode,
                'id' => $receiptId,
            ]);

            $deleteStatement = $this->pdo->prepare('DELETE FROM import_receipt_details WHERE receipt_id = :receipt_id');
            $deleteStatement->execute(['receipt_id' => $receiptId]);

            $insertStatement = $this->pdo->prepare(
                'INSERT INTO import_receipt_details (receipt_id, product_id, import_price, quantity) VALUES (:receipt_id, :product_id, :import_price, :quantity)'
            );

            foreach ($details as $detail) {
                if (!is_array($detail)) {
                    continue;
                }

                $insertStatement->execute([
                    'receipt_id' => $receiptId,
                    'product_id' => $this->toInt($detail['productId'] ?? 0),
                    'import_price' => $this->toFloat($detail['importPrice'] ?? 0),
                    'quantity' => $this->toInt($detail['quantity'] ?? 0),
                ]);
            }

            $this->pdo->commit();
            $this->respondJson([
                'success' => true,
                'receiptId' => $receiptId,
            ]);
        } catch (Throwable $throwable) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $throwable;
        }
    }

    private function updateProfitMargin(): void
    {
        $body = $this->requestJson();
        $productId = $this->toInt($body['productId'] ?? 0);
        $newProfitMargin = $this->toFloat($body['newProfitMargin'] ?? 0);

        $product = $this->fetchOne(
            'SELECT current_import_price FROM products WHERE id = :id LIMIT 1',
            ['id' => $productId]
        );
        if ($product === null) {
            throw new HttpException(404, ['success' => false, 'message' => 'Sản phẩm không tồn tại']);
        }

        $costPrice = $this->toFloat($product['current_import_price'] ?? 0);
        $newSellingPrice = $costPrice * (1 + ($newProfitMargin / 100));

        $statement = $this->pdo->prepare(
            'UPDATE products SET profit_margin = :profit_margin, new_price = :new_price WHERE id = :id'
        );
        $statement->execute([
            'profit_margin' => $newProfitMargin,
            'new_price' => $newSellingPrice,
            'id' => $productId,
        ]);

        $this->respondJson([
            'success' => true,
            'newSellingPrice' => $newSellingPrice,
        ]);
    }

    private function getStockAtTime(): void
    {
        $targetTime = $this->normalizeDateTimeInput((string) ($_GET['targetTime'] ?? ''));
        $category = trim((string) ($_GET['category'] ?? ''));

        if ($targetTime === '') {
            throw new HttpException(400, ['success' => false, 'message' => 'Thiếu mốc thời gian']);
        }

        $sql = <<<'SQL'
SELECT p.id, p.code, p.name, p.category,
       (
           CASE
               WHEN p.date <= :target_time THEN COALESCE(p.initial_stock_quantity, 0)
               ELSE 0
           END
           +
           COALESCE((
           SELECT SUM(ird.quantity)
           FROM import_receipt_details ird
           JOIN import_receipts ir ON ird.receipt_id = ir.id
           WHERE ird.product_id = p.id
             AND ir.status = 'completed'
             AND ir.created_at <= :target_time
       ), 0)
       ) AS total_imported,
       COALESCE((
           SELECT SUM(oi.quantity)
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           WHERE oi.product_id = p.id
             AND o.status <> 'cancelled'
             AND o.created_at <= :target_time
       ), 0) AS total_sold
FROM products p
WHERE 1 = 1
SQL;
        $params = ['target_time' => $targetTime];

        if ($category !== '' && $category !== 'all') {
            $sql .= ' AND p.category = :category';
            $params['category'] = $category;
        }

        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        $rows = $statement->fetchAll();

        $data = array_map(fn(array $row): array => [
            'id' => (int) $row['id'],
            'code' => $row['code'],
            'name' => $row['name'],
            'category' => $row['category'],
            'total_imported' => $this->toInt($row['total_imported']),
            'total_sold' => $this->toInt($row['total_sold']),
            'stock_at_time' => $this->toInt($row['total_imported']) - $this->toInt($row['total_sold']),
        ], $rows);

        $this->respondJson([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function getImportExportReport(): void
    {
        $startDate = $this->normalizeDateTimeInput((string) ($_GET['startDate'] ?? ''), false);
        $endDate = $this->normalizeDateTimeInput((string) ($_GET['endDate'] ?? ''), true);
        if ($startDate === '' || $endDate === '') {
            throw new HttpException(400, ['success' => false, 'message' => 'Thiếu khoảng thời gian']);
        }

        $statement = $this->pdo->prepare(
            <<<'SQL'
SELECT p.id, p.code, p.name,
       (
           CASE
               WHEN p.date >= :start_date AND p.date <= :end_date THEN COALESCE(p.initial_stock_quantity, 0)
               ELSE 0
           END
           +
           COALESCE((
           SELECT SUM(ird.quantity)
           FROM import_receipt_details ird
           JOIN import_receipts ir ON ird.receipt_id = ir.id
           WHERE ird.product_id = p.id
             AND ir.status = 'completed'
             AND ir.created_at >= :start_date
             AND ir.created_at <= :end_date
       ), 0)
       ) AS total_imported,
       COALESCE((
           SELECT SUM(oi.quantity)
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           WHERE oi.product_id = p.id
             AND o.status <> 'cancelled'
             AND o.created_at >= :start_date
             AND o.created_at <= :end_date
       ), 0) AS total_exported
FROM products p
SQL
        );
        $statement->execute([
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        $this->respondJson([
            'success' => true,
            'data' => $statement->fetchAll(),
        ]);
    }

    private function getLowStockReport(): void
    {
        $threshold = filter_var($_GET['threshold'] ?? null, FILTER_VALIDATE_INT);
        if ($threshold === false || $threshold === null) {
            throw new HttpException(400, ['success' => false, 'message' => 'Ngưỡng không hợp lệ']);
        }

        $statement = $this->pdo->prepare(
            <<<'SQL'
SELECT id, code, name, stock_quantity, current_import_price, status
FROM products
WHERE stock_quantity <= :threshold
  AND status <> :status
ORDER BY stock_quantity ASC
SQL
        );
        $statement->execute([
            'threshold' => $threshold,
            'status' => 'hidden',
        ]);

        $this->respondJson([
            'success' => true,
            'data' => $statement->fetchAll(),
        ]);
    }

    private function formatOrderResponse(array $order, array $items): array
    {
        $shipping = $this->decodeJsonColumn($order['shipping_address'] ?? null) ?? [];

        return [
            'orderId' => (int) $order['order_id'],
            'status' => $order['status'],
            'total' => $this->toFloat($order['total']),
            'createdAt' => $order['created_at'],
            'customer' => ($order['customer_id'] ?? null) !== null
                ? [
                    'id' => $this->toInt($order['customer_id']),
                    'name' => $order['user_name'] ?? $order['customer_name'],
                    'email' => $order['user_email'] ?? $order['customer_email'],
                    'status' => $order['user_status'] ?? 'active',
                ]
                : [
                    'name' => $order['customer_name'],
                    'email' => $order['customer_email'],
                ],
            'address' => $shipping['address'] ?? null,
            'delivery_address' => $shipping['address'] ?? null,
            'phone' => $shipping['phone'] ?? null,
            'shippingMethod' => $order['shipping_method'] ?? null,
            'paymentMethod' => $order['payment_method'] ?? null,
            'items' => array_map(fn(array $item): array => [
                'id' => (int) $item['id'],
                'productId' => $item['product_id'] !== null ? (int) $item['product_id'] : null,
                'name' => $item['name'],
                'quantity' => $this->toInt($item['quantity']),
                'price' => $this->toFloat($item['price']),
                'size' => $item['size'] ?? null,
                'image' => $item['resolved_image'] ?? '',
                'code' => $item['resolved_code'] ?? null,
                'unit' => $item['resolved_unit'] ?? 'Cái',
            ], $items),
        ];
    }

    private function fetchOrderItemsByParentIds(array $orderPrimaryIds): array
    {
        if ($orderPrimaryIds === []) {
            return [];
        }

        $placeholders = [];
        $params = [];
        foreach (array_values($orderPrimaryIds) as $index => $orderPrimaryId) {
            $name = 'order_id_' . $index;
            $placeholders[] = ':' . $name;
            $params[$name] = $orderPrimaryId;
        }

        $statement = $this->pdo->prepare(
            sprintf(
                <<<'SQL'
SELECT oi.*,
       COALESCE(oi.image, %s) AS resolved_image,
       COALESCE(oi.code, p.code) AS resolved_code,
       COALESCE(oi.unit, p.unit, 'Cái') AS resolved_unit
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE oi.order_id IN (%s)
ORDER BY oi.id ASC
SQL,
                $this->productPrimaryImageExpression('p'),
                implode(', ', $placeholders)
            )
        );
        $statement->execute($params);
        $rows = $statement->fetchAll();

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[(int) $row['order_id']][] = $row;
        }

        return $grouped;
    }

    private function requireAuthTokenHeader(): array
    {
        $token = $this->getRequestHeaderValue('auth-token');
        if ($token === '') {
            throw new HttpException(401, ['error' => 'No token, authorization denied']);
        }

        try {
            return Jwt::decode($token, $this->jwtSecret);
        } catch (Throwable) {
            throw new HttpException(401, ['error' => 'Token is not valid']);
        }
    }

    private function requireBearerAuth(): array
    {
        $authorizationHeader = $this->getRequestHeaderValue('Authorization');
        if ($authorizationHeader === '' || !str_starts_with($authorizationHeader, 'Bearer ')) {
            throw new HttpException(401, ['success' => false, 'message' => 'Access denied. No token provided.']);
        }

        $token = trim(substr($authorizationHeader, 7));
        if ($token === '') {
            throw new HttpException(401, ['success' => false, 'message' => 'Access denied. No token provided.']);
        }

        try {
            return Jwt::decode($token, $this->jwtSecret);
        } catch (Throwable) {
            throw new HttpException(401, ['success' => false, 'message' => 'Invalid token.']);
        }
    }

    private function requireAdminAuth(): array
    {
        $payload = $this->requireBearerAuth();
        $user = $this->fetchOne(
            'SELECT id, email, role, status FROM users WHERE id = :id AND email = :email LIMIT 1',
            [
                'id' => $this->toInt($payload['id'] ?? 0),
                'email' => (string) ($payload['email'] ?? ''),
            ]
        );

        if ($user === null) {
            throw new HttpException(401, ['success' => false, 'message' => 'Admin session not found.']);
        }

        if (($user['status'] ?? 'active') !== 'active') {
            throw new HttpException(403, ['success' => false, 'message' => 'Account is suspended.']);
        }

        if (($user['role'] ?? 'customer') !== 'admin') {
            throw new HttpException(403, ['success' => false, 'message' => 'Admin access required.']);
        }

        return $payload;
    }

    private function isInventoryAffectingOrderStatus(string $status): bool
    {
        return strtolower(trim($status)) !== 'cancelled';
    }

    private function adjustInventoryForOrderItems(array $items, string $mode): void
    {
        $inventoryDeltaByProduct = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $productId = $this->toInt($item['product_id'] ?? 0);
            $quantity = $this->toInt($item['quantity'] ?? 0);

            if ($productId <= 0 || $quantity <= 0) {
                continue;
            }

            if (!array_key_exists($productId, $inventoryDeltaByProduct)) {
                $inventoryDeltaByProduct[$productId] = [
                    'quantity' => 0,
                    'name' => trim((string) ($item['name'] ?? '')) !== '' ? trim((string) $item['name']) : ('Product #' . $productId),
                ];
            }

            $inventoryDeltaByProduct[$productId]['quantity'] += $quantity;
        }

        foreach ($inventoryDeltaByProduct as $productId => $inventoryChange) {
            $product = $this->fetchOne(
                'SELECT id, name, stock_quantity FROM products WHERE id = :id LIMIT 1 FOR UPDATE',
                ['id' => $productId]
            );

            if ($product === null) {
                continue;
            }

            $currentStock = $this->toInt($product['stock_quantity'] ?? 0);
            $quantity = $this->toInt($inventoryChange['quantity'] ?? 0);
            $nextStock = $mode === 'restore'
                ? $currentStock + $quantity
                : $currentStock - $quantity;

            if ($mode === 'deduct' && $nextStock < 0) {
                throw new HttpException(400, [
                    'success' => false,
                    'message' => sprintf('Insufficient stock for product "%s".', (string) ($product['name'] ?? $inventoryChange['name'] ?? ('Product #' . $productId))),
                ]);
            }

            $statement = $this->pdo->prepare('UPDATE products SET stock_quantity = :stock_quantity WHERE id = :id');
            $statement->execute([
                'stock_quantity' => max($nextStock, 0),
                'id' => $productId,
            ]);
        }
    }

    private function normalizeDateTimeInput(string $value, bool $endOfDay = false): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1) {
            return $value . ($endOfDay ? ' 23:59:59' : ' 00:00:00');
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}$/', $value) === 1) {
            return str_replace('T', ' ', $value) . ':00';
        }

        return str_replace('T', ' ', $value);
    }

    private function getRequestHeaderValue(string $headerName): string
    {
        $normalizedHeader = strtoupper(str_replace('-', '_', $headerName));
        $serverKey = 'HTTP_' . $normalizedHeader;
        $fallbackKeys = [
            $serverKey,
            'REDIRECT_' . $serverKey,
            $normalizedHeader,
            $headerName,
        ];

        foreach ($fallbackKeys as $key) {
            $value = $_SERVER[$key] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        foreach ([$this->getAllRequestHeaders(), $this->getApacheRequestHeaders()] as $headers) {
            foreach ($headers as $name => $value) {
                if (strcasecmp((string) $name, $headerName) !== 0) {
                    continue;
                }

                if (is_string($value) && trim($value) !== '') {
                    return trim($value);
                }
            }
        }

        return '';
    }

    private function getAllRequestHeaders(): array
    {
        if (!function_exists('getallheaders')) {
            return [];
        }

        $headers = getallheaders();
        return is_array($headers) ? $headers : [];
    }

    private function getApacheRequestHeaders(): array
    {
        if (!function_exists('apache_request_headers')) {
            return [];
        }

        $headers = apache_request_headers();
        return is_array($headers) ? $headers : [];
    }

    private function requestJson(): array
    {
        $rawBody = file_get_contents('php://input');
        if ($rawBody === false || trim($rawBody) === '') {
            return [];
        }

        $decoded = json_decode($rawBody, true);
        if (!is_array($decoded)) {
            throw new HttpException(400, ['success' => false, 'message' => 'Invalid JSON body.']);
        }

        return $decoded;
    }

    private function fetchOne(string $sql, array $params = []): ?array
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    private function fetchValue(string $sql, array $params = []): mixed
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);

        return $statement->fetchColumn();
    }

    private function decodeJsonColumn(mixed $value): ?array
    {
        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function normalizeImages(mixed $value): array
    {
        $images = [];

        if (is_array($value)) {
            $images = $value;
        } elseif (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                $images = $decoded;
            } else {
                $images = [$value];
            }
        }

        $filtered = array_values(array_filter(array_map(
            static fn(mixed $image): string => is_string($image) ? trim($image) : '',
            $images
        )));

        return array_values(array_unique($filtered));
    }

    private function sanitizeCartItems(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $sanitized = [];

        foreach ($value as $key => $quantity) {
            if (!is_string($key) || trim($key) === '') {
                continue;
            }

            $normalizedQuantity = $this->toInt($quantity);
            if ($normalizedQuantity <= 0) {
                continue;
            }

            $sanitized[trim($key)] = $normalizedQuantity;
        }

        return $sanitized;
    }

    private function respondJson(array $payload, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function respondText(string $payload, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: text/plain; charset=UTF-8');
        echo $payload;
    }

    private function sendCorsHeaders(): void
    {
        $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));

        if ($origin !== '') {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }

        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, auth-token');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }

    private function isMySql(): bool
    {
        return $this->databaseDriver === 'mysql';
    }

    private function productPrimaryImageExpression(string $tableAlias = ''): string
    {
        $prefix = $tableAlias !== '' ? $tableAlias . '.' : '';

        if ($this->isMySql()) {
            return sprintf(
                "COALESCE(%simage, JSON_UNQUOTE(JSON_EXTRACT(%simages, '$[0]')))",
                $prefix,
                $prefix
            );
        }

        return sprintf('COALESCE(%simage, %simages->>0)', $prefix, $prefix);
    }

    private function isUniqueConstraintViolation(Throwable $throwable): bool
    {
        $code = (string) $throwable->getCode();

        return $code === '23505' || $code === '23000';
    }

    private function toInt(mixed $value): int
    {
        return (int) round((float) $value);
    }

    private function toFloat(mixed $value): float
    {
        return (float) $value;
    }

    private function jsonEncode(mixed $value): string
    {
        return (string) json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
