<?php
session_start();

if (!empty($_SESSION['role'])) {
    header('Location: app.php');
    exit;
}

// Proses form register ditangani oleh actions/register.php

$flashError   = $_SESSION['flash_error'] ?? '';
$flashSuccess = $_SESSION['flash_success'] ?? '';
unset($_SESSION['flash_error'], $_SESSION['flash_success']);

$pageTitle = 'Daftar Akun — Klinik Digital Polibatam';
include 'includes/head.php';
?>
<body>

<div class="auth-page">
  <!-- Panel Kiri -->
  <div class="auth-panel-left">
    <div class="auth-brand">
      <div class="auth-logo-box"><i class="fa-solid fa-hospital-user"></i></div>
      <h1>Daftar Akun<br>Baru</h1>
      <p>Buat akun untuk mengakses layanan klinik kampus Polibatam</p>
      <div class="auth-divider"></div>
      <div class="auth-feature-grid">
        <div class="auth-feature-item"><i class="fa-solid fa-user-graduate"></i><span>Mahasiswa</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-code"></i><span>Informatika</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-bolt"></i><span>Elektro</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-briefcase"></i><span>Bisnis</span></div>
      </div>
    </div>
  </div>

  <!-- Panel Kanan -->
  <div class="auth-panel-right">
    <div class="auth-form-box" style="max-width:460px;">
      <h2>Buat Akun</h2>
      <p class="sub">Isi data diri Anda dengan benar</p>

      <?php if ($flashError): ?>
        <div class="alert alert-danger"><i class="fa-solid fa-circle-exclamation"></i> <?= htmlspecialchars($flashError) ?></div>
      <?php endif; ?>
      <?php if ($flashSuccess): ?>
        <div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($flashSuccess) ?></div>
      <?php endif; ?>

      <form method="post" action="actions/register.php">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nama Lengkap *</label>
            <div class="input-wrap"><i class="pre fa-solid fa-user"></i><input type="text" name="nama" class="form-control" placeholder="Nama lengkap" required></div>
          </div>
          <div class="form-group">
            <label class="form-label">NIM</label>
            <div class="input-wrap"><i class="pre fa-solid fa-id-card"></i><input type="text" name="nim" class="form-control" placeholder="Nomor induk mahasiswa"></div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tanggal Lahir</label>
            <input type="date" name="tgl_lahir" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Jenis Kelamin</label>
            <select name="gender" class="form-control"><option>Laki-laki</option><option>Perempuan</option></select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">No HP</label>
            <div class="input-wrap"><i class="pre fa-solid fa-phone"></i><input type="tel" name="hp" class="form-control" placeholder="08xx..."></div>
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <div class="input-wrap"><i class="pre fa-solid fa-envelope"></i><input type="email" name="email" class="form-control" placeholder="@std.polibatam.ac.id" required></div>
          </div>
        </div>
        <input type="hidden" name="role" value="mahasiswa">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Prodi *</label>
            <select name="prodi" class="form-control">
              <option>Teknik Informatika</option>
              <option>Teknik Elektro</option>
              <option>Teknik Mesin</option>
              <option>Manajemen dan Bisnis</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Password *</label>
            <div class="input-wrap password-wrap">
              <i class="pre fa-solid fa-lock"></i>
              <input type="password" name="password" class="form-control" placeholder="Min. 6 karakter" required minlength="6">
              <button type="button" class="password-toggle" onclick="togglePasswordVisibility(this)" aria-label="Lihat password"><i class="fa-solid fa-eye"></i></button>
            </div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-w-full" style="margin-top:4px;">
          <i class="fa-solid fa-user-plus"></i> Daftar Sekarang
        </button>
      </form>

      <div style="text-align:center;margin-top:14px;">
        <span style="font-size:13px;color:var(--text-light);">Sudah punya akun? </span>
        <a href="login.php" class="link-btn">Masuk</a>
      </div>
    </div>
  </div>
</div>

<script src="assets/js/password_toggle.js"></script>
</body>
</html>
