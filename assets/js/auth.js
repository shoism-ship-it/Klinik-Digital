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

async function openNotifications() {
  try {
    const items = await apiGet('notifications.php', { action: 'list' });
    openModal('Notifikasi', `
      <div class="notification-list">
        ${(items || []).map(item => `
          <div class="notification-item ${item.type || 'info'}">
            <div class="notification-icon"><i class="fa-solid ${notificationIcon(item.type)}"></i></div>
            <div>
              <strong>${item.title}</strong>
              <p>${item.message}</p>
            </div>
          </div>
        `).join('') || '<p style="color:var(--text-light);text-align:center;padding:18px;">Belum ada notifikasi.</p>'}
      </div>
    `, [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}], true);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function notificationIcon(type) {
  if (type === 'warning') return 'fa-triangle-exclamation';
  if (type === 'danger') return 'fa-circle-exclamation';
  if (type === 'success') return 'fa-circle-check';
  return 'fa-circle-info';
}

async function openProfileSettings() {
  try {
    const profile = await apiGet('profile.php', { action: 'get' });
    const isPasien = profile.role === 'pasien';
    const isDokter = profile.role === 'dokter';
    openModal('Pengaturan Profile', `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nama Lengkap *</label>
          <input type="text" id="set-nama" class="form-control" value="${profile.nama || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" value="${profile.email || ''}" disabled>
        </div>
      </div>
      ${isPasien ? `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">NIM</label>
          <input type="text" id="set-nim" class="form-control" value="${profile.nim || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Prodi</label>
          <select id="set-prodi" class="form-control">
            ${prodiOptions().map(p => `<option ${profile.prodi===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tanggal Lahir</label>
          <input type="date" id="set-tgl" class="form-control" value="${profile.tgl_lahir || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Jenis Kelamin</label>
          <select id="set-gender" class="form-control">
            <option value="L" ${profile.gender==='L'?'selected':''}>Laki-laki</option>
            <option value="P" ${profile.gender==='P'?'selected':''}>Perempuan</option>
          </select>
        </div>
      </div>` : ''}
      ${isDokter ? `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Spesialis</label>
          <input type="text" class="form-control" value="${profile.spesialis || ''}" disabled>
        </div>
        <div class="form-group">
          <label class="form-label">Jadwal</label>
          <input type="text" class="form-control" value="${profile.hari || '-'} ${profile.jam || ''}" disabled>
        </div>
      </div>` : ''}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">No HP</label>
          <input type="tel" id="set-hp" class="form-control" value="${profile.hp || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru</label>
          <input type="password" id="set-password" class="form-control" placeholder="Kosongkan jika tidak diubah">
        </div>
      </div>
    `, [
      {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
      {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveProfileSettings()'}
    ], true);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function saveProfileSettings() {
  const payload = {
    nama: val('set-nama'),
    nim: val('set-nim'),
    prodi: val('set-prodi'),
    tgl_lahir: val('set-tgl'),
    gender: val('set-gender') || 'L',
    hp: val('set-hp'),
    password: val('set-password'),
  };

  if (!payload.nama) {
    showToast('Nama wajib diisi!', 'error');
    return;
  }

  try {
    const res = await apiPost('profile.php', 'update', payload);
    showToast(res.msg, 'success');
    closeModal();
    setTimeout(() => window.location.reload(), 650);
  } catch (e) {
    showToast(e.message, 'error');
  }
}
