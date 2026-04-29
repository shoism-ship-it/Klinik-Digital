let _editPasienId = null;
let _pasienData   = [];

async function renderDataPasien() {
  const body = document.getElementById('content-body');
  _pasienData = await apiGet('pasien.php', { action: 'list' });
  _pasienList = _pasienData;
  body.innerHTML = _buildPasienPage(_pasienData);
}

function _buildPasienPage(data) {
  return `
  <div class="section-header">
    <div><h2>Data Pasien</h2><p>Kelola data seluruh pasien terdaftar</p></div>
    <div class="section-header-actions">
      <div class="search-bar" style="width:220px;"><i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Cari pasien..." oninput="filterPasien(this.value)">
      </div>
      <button class="btn btn-primary" onclick="openFormPasien()"><i class="fa-solid fa-user-plus"></i> Tambah Pasien</button>
    </div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Nama</th><th>NIM/NIP</th><th>Prodi/Unit</th><th>Gender</th><th>No HP</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody id="tbody-pasien">${_rowsPasien(data)}</tbody>
      </table>
    </div>
  </div>`;
}

function _rowsPasien(data) {
  if (!data.length) return '<tr><td colspan="9" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada data pasien.</td></tr>';
  return data.map(p => `<tr>
    <td><span class="badge badge-muted">${p.kode}</span></td>
    <td><strong>${p.nama}</strong></td>
    <td>${p.nim||'-'}</td>
    <td>${p.prodi||'-'}</td>
    <td>${p.gender==='P'?'<i class="fa-solid fa-venus" style="color:#e879a0"></i> P':'<i class="fa-solid fa-mars" style="color:var(--c1)"></i> L'}</td>
    <td>${p.hp||'-'}</td>
    <td><span class="badge badge-info">${p.role||'-'}</span></td>
    <td><span class="badge badge-success">${p.status}</span></td>
    <td>
      <button class="btn btn-xs btn-secondary" onclick="openRekamMedisPasien(${p.id},'${p.nama.replace(/'/g,"\\'")}')"><i class="fa-solid fa-file-medical"></i></button>
      <button class="btn btn-xs btn-outline" onclick="openFormPasien(${p.id})"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-xs btn-danger" onclick="hapusPasien(${p.id},'${p.nama.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
    </td>
  </tr>`).join('');
}

async function filterPasien(q) {
  try {
    const data = await apiGet('pasien.php', { action: 'list', q });
    const tbody = document.getElementById('tbody-pasien');
    if (tbody) tbody.innerHTML = _rowsPasien(data);
  } catch (_) {}
}

async function openFormPasien(id = null) {
  _editPasienId = id;
  let p = { nama:'', nim:'', prodi:'Teknik Informatika', tgl_lahir:'', gender:'L', hp:'', role:'Mahasiswa', status:'Aktif' };
  if (id) {
    try { p = await apiGet('pasien.php', { action: 'get', id }); } catch (_) {}
  }
  openModal(id ? 'Edit Data Pasien' : 'Tambah Pasien Baru', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nama Lengkap *</label>
        <div class="input-wrap"><i class="pre fa-solid fa-user"></i><input type="text" id="frm-p-nama" class="form-control" value="${p.nama||''}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">NIM / NIP</label>
        <div class="input-wrap"><i class="pre fa-solid fa-id-card"></i><input type="text" id="frm-p-nim" class="form-control" value="${p.nim||''}"></div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Prodi / Unit</label>
        <select id="frm-p-prodi" class="form-control">
          ${['Teknik Informatika','Sistem Informasi','Teknik Elektro','Manajemen Bisnis','Unit Kemahasiswaan'].map(o=>`<option ${p.prodi===o?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select id="frm-p-role" class="form-control">
          ${['Mahasiswa','Dosen','Staff'].map(o=>`<option ${p.role===o?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tanggal Lahir</label>
        <input type="date" id="frm-p-tgl" class="form-control" value="${p.tgl_lahir||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Jenis Kelamin</label>
        <select id="frm-p-gender" class="form-control">
          <option value="L" ${p.gender==='L'?'selected':''}>Laki-laki</option>
          <option value="P" ${p.gender==='P'?'selected':''}>Perempuan</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">No HP</label>
        <div class="input-wrap"><i class="pre fa-solid fa-phone"></i><input type="tel" id="frm-p-hp" class="form-control" value="${p.hp||''}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="frm-p-status" class="form-control">
          <option ${(p.status||'Aktif')==='Aktif'?'selected':''}>Aktif</option>
          <option ${p.status==='Tidak Aktif'?'selected':''}>Tidak Aktif</option>
        </select>
      </div>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveFormPasien()'}
  ]);
}

async function saveFormPasien() {
  const nama = val('frm-p-nama');
  if (!nama) { showToast('Nama wajib diisi!', 'error'); return; }
  const payload = {
    id: _editPasienId || undefined,
    nama, nim: val('frm-p-nim'), prodi: val('frm-p-prodi'),
    tgl_lahir: val('frm-p-tgl'), gender: val('frm-p-gender'),
    hp: val('frm-p-hp'), role: val('frm-p-role'), status: val('frm-p-status'),
  };
  try {
    const res = await apiPost('pasien.php', _editPasienId ? 'update' : 'create', payload);
    showToast(res.msg, 'success');
    closeModal();
    renderSection('data-pasien');
  } catch (e) { showToast(e.message, 'error'); }
}

function hapusPasien(id, nama) {
  openModal('Hapus Pasien', `
    <p style="text-align:center;padding:12px 0;">Yakin ingin menghapus data pasien <strong>${nama}</strong>?</p>
    <p style="text-align:center;font-size:12px;color:var(--text-light);">Tindakan ini tidak dapat dibatalkan.</p>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusPasien(${id})`}
  ]);
}

async function _konfirmasiHapusPasien(id) {
  try {
    const res = await apiPost('pasien.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('data-pasien');
  } catch (e) { showToast(e.message, 'error'); }
}

async function openRekamMedisPasien(pasienId, nama) {
  try {
    const rm = await apiGet('rekam_medis.php', { action: 'list', pasien_id: pasienId });
    openModal('Rekam Medis — ' + nama,
      rm.length === 0
        ? '<p style="color:var(--text-light);text-align:center;padding:20px;">Belum ada rekam medis</p>'
        : rm.map(r => `
          <div style="border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <span class="badge badge-muted">${r.kode}</span>
              <span style="font-size:12px;color:var(--text-light);">${r.tanggal}</span>
            </div>
            <div class="grid-2">
              <div class="detail-field"><label>Dokter</label><div class="val">${r.nama_dokter}</div></div>
              <div class="detail-field"><label>Diagnosa</label><div class="val">${r.diagnosa}</div></div>
              <div class="detail-field"><label>Keluhan</label><div class="val">${r.keluhan}</div></div>
              <div class="detail-field"><label>Tindakan</label><div class="val">${r.tindakan||'-'}</div></div>
            </div>
          </div>`).join(''),
    [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}]);
  } catch (e) { showToast(e.message, 'error'); }
}
