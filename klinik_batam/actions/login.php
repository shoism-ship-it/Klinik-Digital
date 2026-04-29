<?php
session_start();
require_once __DIR__ . '/../config/db.php';

// ── Quick login via tombol demo ──
if (!empty($_POST['quick_role'])) {
    $roleMap = [
        'admin'  => ['email' => 'admin@polibatam.ac.id'],
        'dokter' => ['email' => 'dokter@polibatam.ac.id'],
        'pasien' => ['email' => 'pasien@polibatam.ac.id'],
    ];
    $role = $_POST['quick_role'];
    if (isset($roleMap[$role])) {
        try {
            $db = getPDO();
            $st = $db->prepare('SELECT id, nama, role FROM users WHERE email = ?');
            $st->execute([$roleMap[$role]['email']]);
            $user = $st->fetch();
            if ($user) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role']    = $user['role'];
                $_SESSION['name']    = $user['nama'];
                header('Location: ../app.php');
                exit;
            }
        } catch (PDOException $e) {
            // DB not ready — fallback to hardcoded
        }
    }
    // Hardcoded fallback (when DB not installed yet)
    $fallback = [
        'admin'  => ['name' => 'Salwa Admin',      'role' => 'admin'],
        'dokter' => ['name' => 'dr. Sarah Amalia', 'role' => 'dokter'],
        'pasien' => ['name' => 'Andi Pratama',      'role' => 'pasien'],
    ];
    if (isset($fallback[$role])) {
        $_SESSION['user_id'] = null;
        $_SESSION['role']    = $fallback[$role]['role'];
        $_SESSION['name']    = $fallback[$role]['name'];
        header('Location: ../app.php');
        exit;
    }
}

// ── Login normal ──
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    $_SESSION['flash_error'] = 'Email dan password wajib diisi.';
    header('Location: ../login.php');
    exit;
}

try {
    $db = getPDO();
    $st = $db->prepare('SELECT id, nama, role, password FROM users WHERE email = ?');
    $st->execute([$email]);
    $user = $st->fetch();

    if ($user && $user['password'] === $password) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role']    = $user['role'];
        $_SESSION['name']    = $user['nama'];
        header('Location: ../app.php');
        exit;
    }
} catch (PDOException $e) {
    // DB unavailable — check session-registered users as fallback
    $regUsers = $_SESSION['reg_users'] ?? [];
    if (isset($regUsers[$email]) && $regUsers[$email]['password'] === $password) {
        $_SESSION['user_id'] = null;
        $_SESSION['role']    = $regUsers[$email]['role'];
        $_SESSION['name']    = $regUsers[$email]['name'];
        header('Location: ../app.php');
        exit;
    }
}

$_SESSION['flash_error'] = 'Email atau password salah.';
header('Location: ../login.php');
exit;
