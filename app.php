<?php
session_start();

// Guard: belum login → redirect ke halaman login
if (empty($_SESSION['role'])) {
    header('Location: login.php');
    exit;
}

$role     = $_SESSION['role'];
$userName = $_SESSION['name'];

$pageTitle = 'Dashboard — Klinik Digital Polibatam';
include 'includes/head.php';
?>
<body>

<div class="app-page">

  <!-- SIDEBAR -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon"><i class="fa-solid fa-hospital-user"></i></div>
      <div class="sidebar-brand-text">
        <strong>Klinik Digital Polibatam</strong>
        <span>SIM Klinik Kampus</span>
      </div>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav"></nav>
    <div class="sidebar-user">
      <div class="sidebar-avatar"><i class="fa-solid fa-user"></i></div>
      <div class="sidebar-user-info">
        <strong id="sidebar-username"><?= htmlspecialchars($userName) ?></strong>
        <span id="sidebar-role-lbl"><?= ucfirst($role) ?></span>
      </div>
      <a href="logout.php" class="sidebar-logout" title="Keluar"><i class="fa-solid fa-right-from-bracket"></i></a>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="main-content">
    <div class="topbar">
      <div class="topbar-title">
        <h2 id="topbar-title">Dashboard</h2>
        <p id="topbar-sub">Selamat datang di sistem informasi klinik</p>
      </div>
      <div class="topbar-right">
        <span class="role-chip role-<?= $role ?>" id="topbar-role-chip"><?= ucfirst($role) ?></span>
        <div class="topbar-badge"><i class="fa-solid fa-bell"></i><div class="dot"></div></div>
        <div class="topbar-badge"><i class="fa-solid fa-gear"></i></div>
      </div>
    </div>
    <div class="content-body" id="content-body"></div>
  </div>
</div>

<?php include 'includes/modal.php'; ?>

<!-- State dari PHP session → JS -->
<script>
const currentRole    = <?= json_encode($role) ?>;
const currentName    = <?= json_encode($userName) ?>;
</script>

<!-- Core utilities -->
<script src="assets/js/data.js"></script>
<script src="assets/js/api.js"></script>

<!-- Core modules -->
<script src="assets/js/modal.js"></script>
<script src="assets/js/sidebar.js"></script>
<script src="assets/js/auth.js"></script>

<!-- Section renderers -->
<script src="assets/js/sections/dashboard.js"></script>
<script src="assets/js/sections/pasien.js"></script>
<script src="assets/js/sections/dokter.js"></script>
<script src="assets/js/sections/jadwal.js"></script>
<script src="assets/js/sections/stok_obat.js"></script>
<script src="assets/js/sections/transaksi.js"></script>
<script src="assets/js/sections/laporan.js"></script>
<script src="assets/js/sections/rekam_medis.js"></script>
<script src="assets/js/sections/resep_obat.js"></script>
<script src="assets/js/sections/booking.js"></script>
<script src="assets/js/sections/riwayat.js"></script>

<!-- Router (butuh semua renderer sudah dimuat) -->
<script src="assets/js/router.js"></script>

<!-- Init app -->
<script>
initApp();
</script>

</body>
</html>
