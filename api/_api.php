<?php
session_start();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');

// Auth guard — semua API butuh login
if (empty($_SESSION['role'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'msg' => 'Unauthorized']);
    exit;
}

$currentRole = $_SESSION['role'];
$currentName = $_SESSION['name'];
$currentUserId = $_SESSION['user_id'] ?? null;

function ok(mixed $data = null, string $msg = 'OK'): void {
    echo json_encode(['ok' => true, 'msg' => $msg, 'data' => $data]);
    exit;
}

function err(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'msg' => $msg]);
    exit;
}

// Parse JSON body
function body(): array {
    static $parsed = null;
    if ($parsed === null) {
        $raw = file_get_contents('php://input');
        $parsed = $raw ? (json_decode($raw, true) ?? []) : [];
        // Fallback to $_POST for form submissions
        if (empty($parsed) && !empty($_POST)) {
            $parsed = $_POST;
        }
    }
    return $parsed;
}

function b(string $key, mixed $default = null): mixed {
    return body()[$key] ?? $default;
}

function kode(string $prefix, int $id): string {
    return $prefix . str_pad($id, 3, '0', STR_PAD_LEFT);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
