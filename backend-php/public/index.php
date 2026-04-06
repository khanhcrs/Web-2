<?php

declare(strict_types=1);

use ClothifyPhp\Application;
use ClothifyPhp\Database;
use ClothifyPhp\Env;
use ClothifyPhp\SchemaManager;

require_once __DIR__ . '/../src/Env.php';
require_once __DIR__ . '/../src/HttpException.php';
require_once __DIR__ . '/../src/Jwt.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/SchemaManager.php';
require_once __DIR__ . '/../src/Application.php';

$basePath = dirname(__DIR__);
Env::load($basePath);

$database = new Database();
$schemaManager = new SchemaManager();
$application = new Application($database->connection(), $schemaManager, $basePath);
$application->handle();
