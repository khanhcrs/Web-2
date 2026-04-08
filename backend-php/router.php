<?php

declare(strict_types=1);

$requestPath = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$publicPath = realpath(__DIR__ . DIRECTORY_SEPARATOR . 'public');

if ($requestPath !== '/' && $publicPath !== false) {
    $candidate = realpath($publicPath . DIRECTORY_SEPARATOR . ltrim($requestPath, '/'));
    if ($candidate !== false && str_starts_with($candidate, $publicPath) && is_file($candidate)) {
        return false;
    }
}

if (str_starts_with($requestPath, '/images/')) {
    $_GET['file'] = basename($requestPath);
    require __DIR__ . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'image.php';
    return true;
}

require __DIR__ . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'index.php';
