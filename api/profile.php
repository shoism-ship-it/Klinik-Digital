<?php
require_once __DIR__ . '/_api.php';

$controller = new \Klinik\Controllers\ProfileController(
    $request,
    $response,
    $auth,
    new \Klinik\Repositories\UserRepository($db)
);
$controller->dispatch($action ?: 'get');
