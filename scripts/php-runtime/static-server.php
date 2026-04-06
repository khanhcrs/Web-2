<?php

declare(strict_types=1);

function clothify_serve_spa(string $buildRoot): void
{
    $resolvedRoot = realpath($buildRoot);
    if ($resolvedRoot === false || !is_dir($resolvedRoot)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'Missing build directory: ' . $buildRoot;
        return;
    }

    $requestPath = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
    if ($requestPath === '') {
        $requestPath = '/';
    }

    if ($requestPath !== '/') {
        $candidate = realpath($resolvedRoot . DIRECTORY_SEPARATOR . ltrim($requestPath, '/'));
        if ($candidate !== false && str_starts_with($candidate, $resolvedRoot) && is_file($candidate)) {
            clothify_stream_file($candidate);
            return;
        }
    }

    $indexFile = $resolvedRoot . DIRECTORY_SEPARATOR . 'index.html';
    if (!is_file($indexFile)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'Missing SPA entry file: ' . $indexFile;
        return;
    }

    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexFile);
}

function clothify_stream_file(string $filePath): void
{
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
