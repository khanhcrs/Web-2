<?php

declare(strict_types=1);

namespace ClothifyPhp;

use PDO;
use PDOException;
use RuntimeException;

final class Database
{
    private ?PDO $pdo = null;

    public function connection(): PDO
    {
        if ($this->pdo instanceof PDO) {
            return $this->pdo;
        }

        $host = $this->env('POSTGRES_HOST', 'localhost');
        $port = $this->env('POSTGRES_PORT', '5432');
        $database = $this->env('POSTGRES_DB', 'clothify');
        $user = $this->env('POSTGRES_USER', 'postgres');
        $password = $this->env('POSTGRES_PASSWORD', '123123');

        $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $database);

        try {
            $this->pdo = new PDO(
                $dsn,
                $user,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $exception) {
            throw new RuntimeException(
                'Unable to connect to PostgreSQL. Update backend-php/.env if needed. ' . $exception->getMessage(),
                0,
                $exception
            );
        }

        return $this->pdo;
    }

    private function env(string $key, string $default): string
    {
        $value = getenv($key);
        if ($value === false || $value === '') {
            return $default;
        }

        return $value;
    }
}
