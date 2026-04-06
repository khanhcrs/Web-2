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
    $imagesRoot = realpath(__DIR__ . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'upload' . DIRECTORY_SEPARATOR . 'images');
    $imageCandidate = $imagesRoot !== false
        ? realpath($imagesRoot . DIRECTORY_SEPARATOR . basename($requestPath))
        : false;

    if ($imagesRoot !== false && $imageCandidate !== false && str_starts_with($imageCandidate, $imagesRoot) && is_file($imageCandidate)) {
        $extension = strtolower((string) pathinfo($imageCandidate, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
        ];

        header('Content-Type: ' . ($mimeTypes[$extension] ?? 'application/octet-stream'));
        header('Content-Length: ' . (string) filesize($imageCandidate));
        readfile($imageCandidate);
        return true;
    }
}

require __DIR__ . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'index.php';
