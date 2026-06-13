<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\StatsController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\StatsRepository($db),
    new \Klinik\Repositories\DokterRepository($db),
    new \Klinik\Repositories\PasienRepository($db)
);
$controller->dispatch($action ?: 'get');
