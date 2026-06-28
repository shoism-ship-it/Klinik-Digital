<?php
session_start();

if (!empty($_SESSION['role'])) {
    header('Location: app.php');
    exit;
}

$flashError = $_SESSION['flash_error'] ?? '';
$flashSuccess = $_SESSION['flash_success'] ?? '';
unset($_SESSION['flash_error'], $_SESSION['flash_success']);

$pageTitle = 'Lupa Password — Klinik Digital Polibatam';
include 'includes/head.php';
?>
<body>

<div class="auth-page">
  <div class="auth-panel-left">
    <div class="auth-brand">
      <div class="auth-logo-box"><i class="fa-solid fa-key"></i></div>
      <h1>Reset<br>Password</h1>
      <p>Masukkan data akun yang sesuai, lalu buat password baru.</p>
      <div class="auth-divider"></div>
      <div class="auth-feature-grid">
        <div class="auth-feature-item"><i class="fa-solid fa-envelope"></i><span>Email</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-user-check"></i><span>Nama</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-id-card"></i><span>NIM / HP</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-lock"></i><span>Password Baru</span></div>
      </div>
    </div>
  </div>

  <div class="auth-panel-right">
    <div class="auth-form-box">
      <h2>Lupa Password</h2>
      <p class="sub">Reset sederhana tanpa email/kode verifikasi</p>

      <?php if ($flashError): ?>
        <div class="alert alert-danger"><i class="fa-solid fa-circle-exclamation"></i> <?= htmlspecialchars($flashError) ?></div>
      <?php endif; ?>
      <?php if ($flashSuccess): ?>
        <div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($flashSuccess) ?></div>
      <?php endif; ?>

      <form method="post" action="actions/reset_password.php">
        <div class="form-group">
          <label class="form-label">Email Akun *</label>
          <div class="input-wrap"><i class="pre fa-solid fa-envelope"></i><input type="email" name="email" class="form-control" placeholder="email akun" required></div>
        </div>
        <div class="form-group">
          <label class="form-label">Nama Lengkap *</label>
          <div class="input-wrap"><i class="pre fa-solid fa-user"></i><input type="text" name="nama" class="form-control" placeholder="nama sesuai akun" required></div>
        </div>
        <div class="form-group">
          <label class="form-label">NIM / No HP</label>
          <div class="input-wrap"><i class="pre fa-solid fa-id-card"></i><input type="text" name="identity" class="form-control" placeholder="isi NIM atau no HP jika ada"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru *</label>
          <div class="input-wrap"><i class="pre fa-solid fa-lock"></i><input type="password" name="password" class="form-control" placeholder="minimal 6 karakter" required minlength="6"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Ulangi Password *</label>
          <div class="input-wrap"><i class="pre fa-solid fa-lock"></i><input type="password" name="password_confirm" class="form-control" placeholder="ulangi password baru" required minlength="6"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-w-full" style="margin-bottom:12px;">
          <i class="fa-solid fa-key"></i> Ubah Password
        </button>
      </form>

      <div style="text-align:center;">
        <a href="login.php" class="link-btn">Kembali ke Login</a>
      </div>
    </div>
  </div>
</div>

</body>
</html>
