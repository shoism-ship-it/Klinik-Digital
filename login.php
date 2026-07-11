<?php
session_start();

// Kalau sudah login, langsung ke app
if (!empty($_SESSION['role'])) {
    header('Location: app.php');
    exit;
}

$flashError   = $_SESSION['flash_error'] ?? '';
$flashSuccess = $_SESSION['flash_success'] ?? '';
unset($_SESSION['flash_error'], $_SESSION['flash_success']);

$pageTitle = 'Login — Klinik Digital Polibatam';
include 'includes/head.php';
?>
<body>

<div class="auth-page">
  <!-- Panel Kiri -->
  <div class="auth-panel-left">
    <div class="auth-brand">
      <div class="auth-logo-box"><i class="fa-solid fa-hospital-user"></i></div>
      <h1>Klinik Digital<br>Polibatam</h1>
      <p>Sistem Informasi Manajemen<br>Klinik Kampus Terpadu</p>
      <div class="auth-divider"></div>
      <div class="auth-feature-grid">
        <div class="auth-feature-item"><i class="fa-solid fa-calendar-check"></i><span>Booking Online</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-file-medical"></i><span>Rekam Medis</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-pills"></i><span>Stok Obat</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-chart-line"></i><span>Laporan</span></div>
      </div>
    </div>
  </div>

  <!-- Panel Kanan -->
  <div class="auth-panel-right">
    <div class="auth-form-box">
      <h2>Selamat Datang</h2>
      <p class="sub">Masuk ke sistem klinik kampus Polibatam</p>

      <?php if ($flashError): ?>
        <div class="alert alert-danger"><i class="fa-solid fa-circle-exclamation"></i> <?= htmlspecialchars($flashError) ?></div>
      <?php endif; ?>
      <?php if ($flashSuccess): ?>
        <div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($flashSuccess) ?></div>
      <?php endif; ?>

      <form method="post" action="actions/login.php">
        <div class="form-group">
          <label class="form-label">Email</label>
          <div class="input-wrap">
            <i class="pre fa-solid fa-user"></i>
            <input type="email" name="email" class="form-control" placeholder="Masukkan email Anda">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-wrap password-wrap">
            <i class="pre fa-solid fa-lock"></i>
            <input type="password" name="password" class="form-control" placeholder="Password Anda">
            <button type="button" class="password-toggle" onclick="togglePasswordVisibility(this)" aria-label="Lihat password"><i class="fa-solid fa-eye"></i></button>
          </div>
        </div>
        <div class="login-options">
          <label>
            <input type="checkbox" checked> Ingat saya
          </label>
          <a href="forgot_password.php" class="link-btn">Lupa password?</a>
        </div>

        <button type="submit" class="btn btn-primary btn-w-full" style="margin-bottom:12px;">
          <i class="fa-solid fa-right-to-bracket"></i> Masuk
        </button>
      </form>

      <div style="text-align:center;">
        <span style="font-size:13px;color:var(--text-light);">Belum punya akun? </span>
        <a href="register.php" class="link-btn">Daftar Akun</a>
      </div>
    </div>
  </div>
</div>

<script src="assets/js/password_toggle.js"></script>
</body>
</html>
