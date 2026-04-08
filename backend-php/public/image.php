<?php

declare(strict_types=1);

$file = basename((string) ($_GET['file'] ?? ''));
if ($file === '') {
    http_response_code(404);
    exit('Image not found.');
}

function resolveImagePath(string $file): array
{
    $candidateRoots = [
        __DIR__ . '/../storage/upload/images',
        __DIR__ . '/images',
    ];

    foreach ($candidateRoots as $root) {
        $resolvedRoot = realpath($root);
        if ($resolvedRoot === false) {
            continue;
        }

        $resolvedPath = realpath($resolvedRoot . DIRECTORY_SEPARATOR . $file);
        if (
            $resolvedPath !== false &&
            str_starts_with($resolvedPath, $resolvedRoot) &&
            is_file($resolvedPath)
        ) {
            return [$resolvedRoot, $resolvedPath];
        }
    }

    return [false, false];
}

[$imagesRoot, $imagePath] = resolveImagePath($file);

if ($imagesRoot === false || $imagePath === false) {
    http_response_code(404);
    exit('Image not found.');
}

$extension = strtolower((string) pathinfo($imagePath, PATHINFO_EXTENSION));
$mimeTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
];

header('Content-Type: ' . ($mimeTypes[$extension] ?? 'application/octet-stream'));
header('Content-Length: ' . (string) filesize($imagePath));
readfile($imagePath);
