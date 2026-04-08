<?php

declare(strict_types=1);

namespace ClothifyPhp;

use PDO;
use PDOException;
use RuntimeException;

final class Database
{
    private ?PDO $pdo = null;
    private string $driver = '';

    public function connection(): PDO
    {
        if ($this->pdo instanceof PDO) {
            return $this->pdo;
        }

        $this->driver = $this->resolveDriver();

        if ($this->driver === 'mysql') {
            $host = $this->envAny(['MYSQL_HOST', 'DB_HOST'], '127.0.0.1');
            $port = $this->envAny(['MYSQL_PORT', 'DB_PORT'], '3306');
            $database = $this->envAny(['MYSQL_DATABASE', 'DB_NAME'], 'clothify');
            $user = $this->envAny(['MYSQL_USER', 'DB_USER'], 'root');
            $password = $this->envAny(['MYSQL_PASSWORD', 'DB_PASSWORD'], '');
            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);
            $connectionLabel = 'MySQL/MariaDB';
        } else {
            $host = $this->envAny(['POSTGRES_HOST', 'DB_HOST'], 'localhost');
            $port = $this->envAny(['POSTGRES_PORT', 'DB_PORT'], '5432');
            $database = $this->envAny(['POSTGRES_DB', 'DB_NAME'], 'clothify');
            $user = $this->envAny(['POSTGRES_USER', 'DB_USER'], 'postgres');
            $password = $this->envAny(['POSTGRES_PASSWORD', 'DB_PASSWORD'], '123123');
            $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $database);
            $connectionLabel = 'PostgreSQL';
        }

        try {
            $this->pdo = new PDO(
                $dsn,
                $user,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => $this->driver === 'mysql',
                ]
            );
        } catch (PDOException $exception) {
            throw new RuntimeException(
                'Unable to connect to ' . $connectionLabel . '. Update backend-php/.env if needed. ' . $exception->getMessage(),
                0,
                $exception
            );
        }

        return $this->pdo;
    }

    public function driver(): string
    {
        if ($this->driver !== '') {
            return $this->driver;
        }

        return $this->resolveDriver();
    }

    private function resolveDriver(): string
    {
        $configured = strtolower($this->envAny(['DB_DRIVER', 'DB_CONNECTION'], ''));
        if ($configured === 'mysql') {
            return 'mysql';
        }

        if ($configured === 'pgsql' || $configured === 'postgres' || $configured === 'postgresql') {
            return 'pgsql';
        }

        if (getenv('MYSQL_HOST') !== false || getenv('MYSQL_DATABASE') !== false) {
            return 'mysql';
        }

        return 'pgsql';
    }

    private function envAny(array $keys, string $default): string
    {
        foreach ($keys as $key) {
            $value = getenv($key);
            if ($value !== false && $value !== '') {
                return (string) $value;
            }
        }

        return $default;
    }
}
