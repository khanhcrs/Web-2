<?php

declare(strict_types=1);

namespace ClothifyPhp;

use RuntimeException;

final class HttpException extends RuntimeException
{
    public function __construct(
        private readonly int $statusCode,
        private readonly array|string $payload,
        string $message = ''
    ) {
        parent::__construct($message !== '' ? $message : (is_string($payload) ? $payload : 'HTTP error.'));
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }

    public function payload(): array|string
    {
        return $this->payload;
    }
}
