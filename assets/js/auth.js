const roleInfo = {
  admin:  { label:'Admin',     chip:'role-admin' },
  dokter: { label:'Dokter',    chip:'role-dokter' },
  pasien: { label:'Mahasiswa', chip:'role-pasien' },
};

async function initApp() {
  const info = roleInfo[currentRole] || { label: currentRole, chip: 'role-pasien' };
  document.getElementById('sidebar-username').textContent = currentName || 'Pengguna';
  document.getElementById('sidebar-role-lbl').textContent = info.label;
  const chip = document.getElementById('topbar-role-chip');
  chip.textContent = info.label;
  chip.className = 'role-chip ' + info.chip;
  buildSidebar();
  await reloadReferenceData();
  renderSection('dashboard');
}

async function reloadReferenceData() {
  try {
    const [pasien, dokter, obat] = await Promise.all([
      apiGet('pasien.php', { action: 'list' }),
      apiGet('dokter.php', { action: 'list' }),
      apiGet('obat.php',   { action: 'list' }),
    ]);
    _pasienList = pasien || [];
    _dokterList = dokter || [];
    _obatList   = obat   || [];
  } catch (_) {
    // DB not available yet — reference lists stay empty, dropdowns degrade gracefully
  }
}

function logout() {
  window.location.href = 'logout.php';
}

function openTopbarInfo(title, message) {
  openModal(title, `<p style="padding:8px 0 4px;line-height:1.6;color:var(--text-light);">${message}</p>`, [
    {label:'Tutup', cls:'btn-secondary', action:'closeModal()'}
  ]);
}
