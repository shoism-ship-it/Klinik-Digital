<?php
session_start();
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../forgot_password.php');
    exit;
}

$email = trim($_POST['email'] ?? '');
$nama = trim($_POST['nama'] ?? '');
$identity = trim($_POST['identity'] ?? '');
$password = $_POST['password'] ?? '';
$confirm = $_POST['password_confirm'] ?? '';

if (!$email || !$nama || !$password || !$confirm) {
    $_SESSION['flash_error'] = 'Email, nama, dan password baru wajib diisi.';
    header('Location: ../forgot_password.php');
    exit;
}

if (strlen($password) < 6) {
    $_SESSION['flash_error'] = 'Password minimal 6 karakter.';
    header('Location: ../forgot_password.php');
    exit;
}

if ($password !== $confirm) {
    $_SESSION['flash_error'] = 'Konfirmasi password tidak sama.';
    header('Location: ../forgot_password.php');
    exit;
}

try {
    $users = new \Klinik\Repositories\UserRepository(getPDO());
    $users->resetPasswordWithIdentity($email, $nama, $identity, $password);
    $_SESSION['flash_success'] = 'Password berhasil diubah. Silakan login dengan password baru.';
    header('Location: ../login.php');
    exit;
} catch (Throwable $e) {
    $_SESSION['flash_error'] = $e->getMessage();
    header('Location: ../forgot_password.php');
    exit;
}
