<?php
require_once __DIR__ . '/../src/bootstrap.php';

use Klinik\Core\Database;

define('DB_HOST', 'localhost');
define('DB_NAME', 'klinik_polibatam');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHAR', 'utf8mb4');

function getPDO(): PDO {
    return Database::connection();
}
