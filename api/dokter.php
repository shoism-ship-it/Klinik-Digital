<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\DokterController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\DokterRepository($db)
);
$controller->dispatch($action);
