<?php
session_start();
require_once __DIR__ . '/../config/db.php';

$authService = null;
try {
    $authService = new \Klinik\Services\AuthService(
        new \Klinik\Repositories\UserRepository(getPDO())
    );
} catch (PDOException) {
}

function signInAndRedirect(array $user): void {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    header('Location: ../app.php');
    exit;
}

if (!empty($_POST['quick_role'])) {
    $role = (string)$_POST['quick_role'];
    $user = $authService?->quickLogin($role);
    if (!$user) {
        $fallback = [
            'admin' => ['id' => null, 'name' => 'Ahmad Admin', 'role' => 'admin'],
            'dokter' => ['id' => null, 'name' => 'dr. Sarah Amalia', 'role' => 'dokter'],
            'dokter2' => ['id' => null, 'name' => 'dr. Hendra Kusuma', 'role' => 'dokter'],
            'dokter3' => ['id' => null, 'name' => 'dr. Putri Maharani', 'role' => 'dokter'],
            'pasien' => ['id' => null, 'name' => 'Andi Pratama', 'role' => 'pasien'],
        ];
        $user = $fallback[$role] ?? null;
    }
    if ($user) {
        signInAndRedirect($user);
    }
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    $_SESSION['flash_error'] = 'Email dan password wajib diisi.';
    header('Location: ../login.php');
    exit;
}

$user = $authService?->login($email, $password, $_SESSION['reg_users'] ?? []);
if (!$user) {
    $regUsers = $_SESSION['reg_users'] ?? [];
    if (isset($regUsers[$email]) && $regUsers[$email]['password'] === $password) {
        $user = ['id' => null, 'name' => $regUsers[$email]['name'], 'role' => $regUsers[$email]['role']];
    }
}
if ($user) {
    signInAndRedirect($user);
}

$_SESSION['flash_error'] = 'Email atau password salah.';
header('Location: ../login.php');
exit;
