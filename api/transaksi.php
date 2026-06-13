<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\TransaksiController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\TransaksiRepository($db),
    new \Klinik\Repositories\PasienRepository($db)
);
$controller->dispatch($action);
