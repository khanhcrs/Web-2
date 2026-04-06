<?php

declare(strict_types=1);

require __DIR__ . DIRECTORY_SEPARATOR . 'static-server.php';

clothify_serve_spa(__DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'admin' . DIRECTORY_SEPARATOR . 'dist');
