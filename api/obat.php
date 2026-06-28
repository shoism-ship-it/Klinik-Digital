<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\ObatController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\ObatRepository($db)
);
$controller->dispatch($action);
