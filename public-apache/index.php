<?php

declare(strict_types=1);

const CLOTHIFY_FRONTEND_BUILD = __DIR__ . '/../frontend/build';
const CLOTHIFY_ADMIN_DIST = __DIR__ . '/../admin/dist';
const CLOTHIFY_BACKEND_PUBLIC = __DIR__ . '/../backend-php/public';

$requestPath = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
if ($requestPath === '') {
    $requestPath = '/';
}

if (clothify_handle_admin($requestPath)) {
    return;
}

if (clothify_handle_api($requestPath)) {
    return;
}

if (clothify_serve_frontend_asset($requestPath)) {
    return;
}

if (clothify_serve_if_exists(CLOTHIFY_FRONTEND_BUILD, $requestPath)) {
    return;
}

clothify_serve_file(CLOTHIFY_FRONTEND_BUILD . '/index.html');

function clothify_handle_admin(string $requestPath): bool
{
    if ($requestPath === '/admin') {
        clothify_serve_file(CLOTHIFY_ADMIN_DIST . '/index.html');
        return true;
    }

    if ($requestPath === '/admin/' || str_starts_with($requestPath, '/admin/')) {
        $adminPath = substr($requestPath, strlen('/admin'));
        $adminPath = $adminPath === false || $adminPath === '' ? '/' : $adminPath;

        if (clothify_serve_if_exists(CLOTHIFY_ADMIN_DIST, $adminPath)) {
            return true;
        }

        clothify_serve_file(CLOTHIFY_ADMIN_DIST . '/index.html');
        return true;
    }

    return false;
}

function clothify_handle_api(string $requestPath): bool
{
    if (!str_starts_with($requestPath, '/api/')) {
        return false;
    }

    if (str_starts_with($requestPath, '/api/static/')) {
        $frontendPath = substr($requestPath, strlen('/api'));
        if (is_string($frontendPath) && clothify_serve_if_exists(CLOTHIFY_FRONTEND_BUILD, $frontendPath)) {
            return true;
        }
    }

    $backendPath = $requestPath;
    if (!str_starts_with($requestPath, '/api/reports/')) {
        $backendPath = substr($requestPath, strlen('/api'));
        if ($backendPath === false || $backendPath === '') {
            $backendPath = '/';
        }
    }

    if (str_starts_with($backendPath, '/images/')) {
        $_GET['file'] = basename($backendPath);
        require CLOTHIFY_BACKEND_PUBLIC . '/image.php';
        return true;
    }

    clothify_forward_to_backend($backendPath);
    return true;
}

function clothify_forward_to_backend(string $backendPath): void
{
    $originalRequestUri = $_SERVER['REQUEST_URI'] ?? $backendPath;
    $queryString = $_SERVER['QUERY_STRING'] ?? '';

    $_SERVER['REQUEST_URI'] = $backendPath . ($queryString !== '' ? '?' . $queryString : '');
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    $_SERVER['PHP_SELF'] = '/index.php';

    require CLOTHIFY_BACKEND_PUBLIC . '/index.php';

    $_SERVER['REQUEST_URI'] = $originalRequestUri;
}

function clothify_serve_frontend_asset(string $requestPath): bool
{
    $normalizedAssetPath = clothify_normalize_frontend_asset_path($requestPath);
    if ($normalizedAssetPath === null) {
        return false;
    }

    return clothify_serve_if_exists(CLOTHIFY_FRONTEND_BUILD, $normalizedAssetPath);
}

function clothify_normalize_frontend_asset_path(string $requestPath): ?string
{
    if ($requestPath === '/' || $requestPath === '') {
        return null;
    }

    $rootFiles = [
        '/asset-manifest.json',
        '/favicon.ico',
        '/logo192.png',
        '/logo512.png',
        '/manifest.json',
        '/robots.txt',
    ];

    foreach ($rootFiles as $filePath) {
        if ($requestPath === $filePath || str_ends_with($requestPath, $filePath)) {
            return $filePath;
        }
    }

    $staticPosition = strpos($requestPath, '/static/');
    if ($staticPosition !== false) {
        return substr($requestPath, $staticPosition);
    }

    return null;
}

function clothify_serve_if_exists(string $root, string $requestPath): bool
{
    if ($requestPath === '/' || $requestPath === '') {
        return false;
    }

    $rootPath = realpath($root);
    if ($rootPath === false) {
        return false;
    }

    $candidate = realpath($rootPath . DIRECTORY_SEPARATOR . ltrim($requestPath, '/'));
    if ($candidate === false || !str_starts_with($candidate, $rootPath) || !is_file($candidate)) {
        return false;
    }

    clothify_serve_file($candidate);
    return true;
}

function clothify_serve_file(string $filePath): void
{
    if (!is_file($filePath)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'File not found.';
        return;
    }

    $extension = strtolower((string) pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeMap = [
        'css' => 'text/css; charset=UTF-8',
        'gif' => 'image/gif',
        'html' => 'text/html; charset=UTF-8',
        'ico' => 'image/x-icon',
        'jpeg' => 'image/jpeg',
        'jpg' => 'image/jpeg',
        'js' => 'application/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'map' => 'application/json; charset=UTF-8',
        'png' => 'image/png',
        'svg' => 'image/svg+xml',
        'txt' => 'text/plain; charset=UTF-8',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
    ];

    header('Content-Type: ' . ($mimeMap[$extension] ?? 'application/octet-stream'));
    header('Content-Length: ' . (string) filesize($filePath));
    readfile($filePath);
}
