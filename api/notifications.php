<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\NotificationController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\StatsRepository($db),
    new \Klinik\Repositories\BookingRepository($db),
    new \Klinik\Repositories\TransaksiRepository($db),
    new \Klinik\Repositories\PasienRepository($db),
    new \Klinik\Repositories\DokterRepository($db)
);
$controller->dispatch($action ?: 'list');
