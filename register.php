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
        <div class="auth-feature-item"><i class="fa-solid fa-chalkboard-user"></i><span>Dosen</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-id-badge"></i><span>Staff</span></div>
        <div class="auth-feature-item"><i class="fa-solid fa-shield-halved"></i><span>Terverifikasi</span></div>
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
            <label class="form-label">NIM / NIP / ID Staff</label>
            <div class="input-wrap"><i class="pre fa-solid fa-id-card"></i><input type="text" name="nim" class="form-control" placeholder="Nomor identitas"></div>
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
            <label class="form-label">Email Kampus *</label>
            <div class="input-wrap"><i class="pre fa-solid fa-envelope"></i><input type="email" name="email" class="form-control" placeholder="@std.polibatam.ac.id" required></div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Role</label>
            <select name="role" class="form-control" id="reg-role" onchange="updateRegFields()">
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prodi / Unit Kerja</label>
            <select name="prodi" class="form-control">
              <option>Teknik Informatika</option>
              <option>Sistem Informasi</option>
              <option>Teknik Elektro</option>
              <option>Manajemen Bisnis</option>
              <option>Unit Kemahasiswaan</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" id="reg-jabatan-label">Semester</label>
            <select name="jabatan" class="form-control" id="reg-jabatan-select">
              <option>Semester 1</option><option>Semester 2</option><option>Semester 3</option>
              <option>Semester 4</option><option>Semester 5</option><option>Semester 6</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Password *</label>
            <div class="input-wrap"><i class="pre fa-solid fa-lock"></i><input type="password" name="password" class="form-control" placeholder="Min. 6 karakter" required minlength="6"></div>
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

<script>
function updateRegFields() {
  const role = document.getElementById('reg-role')?.value;
  const lbl  = document.getElementById('reg-jabatan-label');
  const sel  = document.getElementById('reg-jabatan-select');
  if (!lbl || !sel) return;
  if (role === 'mahasiswa') {
    lbl.textContent = 'Semester';
    sel.innerHTML = [1,2,3,4,5,6].map(s=>`<option>Semester ${s}</option>`).join('');
  } else if (role === 'dosen') {
    lbl.textContent = 'Status Dosen';
    sel.innerHTML = '<option>Dosen Tetap</option><option>Dosen LB</option>';
  } else {
    lbl.textContent = 'Jabatan';
    sel.innerHTML = '<option>Administrasi</option><option>Keuangan</option><option>Teknisi</option><option>Keamanan</option>';
  }
}
</script>
</body>
</html>
