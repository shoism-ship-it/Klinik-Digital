<?php
session_start();
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../register.php');
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$nama = trim($_POST['nama'] ?? '');

if (!$email || !$password || !$nama) {
    $_SESSION['flash_error'] = 'Nama, email, dan password wajib diisi.';
    header('Location: ../register.php');
    exit;
}

try {
    $db = getPDO();
    $service = new \Klinik\Services\RegistrationService(
        $db,
        new \Klinik\Repositories\UserRepository($db)
    );
    $service->register(array_merge($_POST, [
        'email' => $email,
        'password' => $password,
        'nama' => $nama,
    ]));

    $_SESSION['flash_success'] = 'Pendaftaran berhasil! Silakan login.';
    header('Location: ../login.php');
    exit;
} catch (RuntimeException $e) {
    $_SESSION['flash_error'] = $e->getMessage();
    header('Location: ../register.php');
    exit;
} catch (PDOException $e) {
    $hardcoded = ['admin@polibatam.ac.id','dokter@polibatam.ac.id','pasien@polibatam.ac.id'];
    $regUsers = $_SESSION['reg_users'] ?? [];

    if (in_array($email, $hardcoded, true) || isset($regUsers[$email])) {
        $_SESSION['flash_error'] = 'Email sudah terdaftar.';
        header('Location: ../register.php');
        exit;
    }

    $_SESSION['reg_users'][$email] = ['password' => $password, 'role' => 'pasien', 'name' => $nama];
    $_SESSION['flash_success'] = 'Pendaftaran berhasil! Silakan login.';
    header('Location: ../login.php');
    exit;
}
