<?php
session_start();
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../register.php');
    exit;
}

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$nama     = trim($_POST['nama'] ?? '');
$roleRaw  = strtolower($_POST['role'] ?? 'pasien');
$roleMap  = ['mahasiswa'=>'pasien','dosen'=>'pasien','staff'=>'pasien','pasien'=>'pasien','dokter'=>'dokter','admin'=>'admin'];
$roleKey  = $roleMap[$roleRaw] ?? 'pasien';

if (!$email || !$password || !$nama) {
    $_SESSION['flash_error'] = 'Nama, email, dan password wajib diisi.';
    header('Location: ../register.php');
    exit;
}

try {
    $db = getPDO();

    // Cek duplikat email
    $st = $db->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetchColumn()) {
        $_SESSION['flash_error'] = 'Email sudah terdaftar. Gunakan email lain.';
        header('Location: ../register.php');
        exit;
    }

    $db->beginTransaction();

    // Simpan ke tabel users
    $st = $db->prepare('INSERT INTO users (email, password, role, nama) VALUES (?, ?, ?, ?)');
    $st->execute([$email, $password, $roleKey, $nama]);
    $userId = (int)$db->lastInsertId();

    // Jika pasien, buat juga record di tabel pasien
    if ($roleKey === 'pasien') {
        $tglLahir = $_POST['tgl_lahir'] ?? null;
        $gender   = $_POST['gender'] === 'Perempuan' ? 'P' : 'L';
        $nim      = trim($_POST['nim'] ?? '');
        $hp       = trim($_POST['hp'] ?? '');
        $prodi    = $_POST['prodi'] ?? '';
        $jabatan  = $_POST['jabatan'] ?? '';
        $roleLabel = ucfirst($roleRaw);

        $st = $db->prepare('INSERT INTO pasien (user_id, nama, nim, prodi, tgl_lahir, gender, hp, role, status)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, "Aktif")');
        $st->execute([
            $userId, $nama, $nim, $prodi,
            $tglLahir ?: null, $gender, $hp, $roleLabel,
        ]);
    }

    $db->commit();
    $_SESSION['flash_success'] = 'Pendaftaran berhasil! Silakan login.';
    header('Location: ../login.php');
    exit;

} catch (PDOException $e) {
    // DB not ready — fallback ke session storage
    if (isset($db) && $db->inTransaction()) $db->rollBack();

    $hardcoded = ['admin@polibatam.ac.id','dokter@polibatam.ac.id','pasien@polibatam.ac.id'];
    $regUsers  = $_SESSION['reg_users'] ?? [];
    if (in_array($email, $hardcoded) || isset($regUsers[$email])) {
        $_SESSION['flash_error'] = 'Email sudah terdaftar.';
        header('Location: ../register.php');
        exit;
    }
    $_SESSION['reg_users'][$email] = ['password' => $password, 'role' => $roleKey, 'name' => $nama];
    $_SESSION['flash_success'] = 'Pendaftaran berhasil! Silakan login.';
    header('Location: ../login.php');
    exit;
}
