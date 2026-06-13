<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\ResepController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\ResepRepository($db),
    new \Klinik\Repositories\RekamMedisRepository($db),
    new \Klinik\Repositories\DokterRepository($db),
    new \Klinik\Repositories\PasienRepository($db)
);
$controller->dispatch($action);
