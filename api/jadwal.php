<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\JadwalController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\JadwalRepository($db),
    new \Klinik\Repositories\DokterRepository($db)
);
$controller->dispatch($action);
