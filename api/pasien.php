<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\PasienController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\PasienRepository($db)
);
$controller->dispatch($action);
