let _editObatId = null;
let _obatData   = [];

async function renderStokObat() {
  const body = document.getElementById('content-body');
  _obatData = await apiGet('obat.php', { action: 'list' });
  _obatList = _obatData;
  body.innerHTML = _buildStokPage(_obatData);
}

function _buildStokPage(data) {
  const kritis = data.filter(o => o.stok < 10).length;
  const minim  = data.filter(o => o.stok >= 10 && o.stok < 30).length;
  const aman   = data.filter(o => o.stok >= 30).length;
  return `
  <div class="section-header">
    <div><h2>Stok Obat</h2><p>Monitoring dan kelola persediaan obat klinik</p></div>
    <div class="section-header-actions">
      <button class="btn btn-primary" onclick="openFormObat()"><i class="fa-solid fa-plus"></i> Tambah Obat</button>
    </div>
  </div>
  <div class="stats-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-box"></i></div><div><div class="stat-val">${data.length}</div><div class="stat-lbl">Jenis Obat</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-check-circle"></i></div><div><div class="stat-val">${aman}</div><div class="stat-lbl">Stok Aman</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-exclamation-circle"></i></div><div><div class="stat-val">${minim}</div><div class="stat-lbl">Stok Minim</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-times-circle"></i></div><div><div class="stat-val">${kritis}</div><div class="stat-lbl">Stok Kritis</div></div></div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Nama Obat</th><th>Kategori</th><th>Stok</th><th>Satuan</th><th>Harga</th><th>Kadaluarsa</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.map(o => {
            const cls = o.stok < 10 ? 'badge-danger' : o.stok < 30 ? 'badge-warning' : 'badge-success';
            const lbl = o.stok < 10 ? 'Kritis' : o.stok < 30 ? 'Minim' : 'Aman';
            return `<tr>
              <td><span class="badge badge-muted">${o.kode}</span></td>
              <td><strong>${o.nama}</strong></td>
              <td>${o.kategori||'-'}</td>
              <td><strong style="color:${o.stok<10?'var(--danger)':o.stok<30?'var(--warning)':'var(--success)'};">${o.stok}</strong></td>
              <td>${o.satuan}</td>
              <td>${o.harga ? fmtRupiah(o.harga) : '-'}</td>
              <td>${o.kadaluarsa||'-'}</td>
              <td><span class="badge ${cls}">${lbl}</span></td>
              <td>
                <button class="btn btn-xs btn-outline" onclick="openUpdateStok(${o.id})"><i class="fa-solid fa-arrows-rotate"></i> Update</button>
                <button class="btn btn-xs btn-secondary" onclick="openFormObat(${o.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-xs btn-danger" onclick="hapusObat(${o.id},'${o.nama.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function openFormObat(id = null) {
  _editObatId = id;
  let o = { nama:'', kategori:'', stok:0, satuan:'Tablet', harga:0, kadaluarsa:'' };
  if (id) {
    try { o = await apiGet('obat.php', { action: 'get', id }); } catch (_) {}
  }
  openModal(id ? 'Edit Data Obat' : 'Tambah Data Obat', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nama Obat *</label>
        <div class="input-wrap"><i class="pre fa-solid fa-pills"></i><input type="text" id="frm-o-nama" class="form-control" value="${o.nama||''}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Kategori</label>
        <select id="frm-o-kategori" class="form-control">
          ${['Analgesik','Antibiotik','Vitamin','Antasida','Antihistamin','Lainnya'].map(s=>`<option ${o.kategori===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Stok</label>
        <input type="number" id="frm-o-stok" class="form-control" min="0" value="${o.stok??0}">
      </div>
      <div class="form-group">
        <label class="form-label">Satuan</label>
        <select id="frm-o-satuan" class="form-control">
          ${['Tablet','Kapsul','Botol','Ampul','Sachet'].map(s=>`<option ${o.satuan===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Harga (Rp)</label>
        <input type="number" id="frm-o-harga" class="form-control" min="0" value="${o.harga||0}">
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal Kadaluarsa</label>
        <input type="date" id="frm-o-kadaluarsa" class="form-control" value="${o.kadaluarsa||''}">
      </div>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveFormObat()'}
  ]);
}

async function saveFormObat() {
  const nama = val('frm-o-nama');
  if (!nama) { showToast('Nama obat wajib diisi!', 'error'); return; }
  const payload = {
    id: _editObatId || undefined,
    nama, kategori: val('frm-o-kategori'),
    stok: parseInt(val('frm-o-stok'))||0,
    satuan: val('frm-o-satuan'),
    harga: parseInt(val('frm-o-harga'))||0,
    kadaluarsa: val('frm-o-kadaluarsa'),
  };
  try {
    const res = await apiPost('obat.php', _editObatId ? 'update' : 'create', payload);
    showToast(res.msg, 'success');
    closeModal();
    renderSection('stok-obat');
  } catch (e) { showToast(e.message, 'error'); }
}

function openUpdateStok(id) {
  const o = _obatData.find(x => x.id === id) || {};
  openModal('Update Stok — ' + o.nama, `
    <div class="form-group">
      <label class="form-label">Stok Saat Ini</label>
      <div class="input-wrap"><i class="pre fa-solid fa-box"></i>
        <input type="number" class="form-control" id="stok-new-val" value="${o.stok}" min="0">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tambah / Kurang Cepat</label>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-success" onclick="document.getElementById('stok-new-val').value=Math.max(0,parseInt(document.getElementById('stok-new-val').value||0)+10)">+10</button>
        <button class="btn btn-success" onclick="document.getElementById('stok-new-val').value=Math.max(0,parseInt(document.getElementById('stok-new-val').value||0)+50)">+50</button>
        <button class="btn btn-danger" onclick="document.getElementById('stok-new-val').value=Math.max(0,parseInt(document.getElementById('stok-new-val').value||0)-10)">-10</button>
      </div>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Update', cls:'btn-primary', action:`saveUpdateStok(${id})`}
  ]);
}

async function saveUpdateStok(id) {
  const newVal = parseInt(document.getElementById('stok-new-val')?.value) || 0;
  const o      = _obatData.find(x => x.id === id) || { stok: 0 };
  const delta  = newVal - o.stok;
  try {
    const res = await apiPost('obat.php', 'update_stok', { id, delta });
    closeModal();
    showToast(res.msg, 'success');
    renderSection('stok-obat');
  } catch (e) { showToast(e.message, 'error'); }
}

function hapusObat(id, nama) {
  openModal('Hapus Obat', `
    <p style="text-align:center;padding:12px 0;">Yakin ingin menghapus <strong>${nama}</strong> dari daftar obat?</p>
    <p style="text-align:center;font-size:12px;color:var(--text-light);">Tindakan ini tidak dapat dibatalkan.</p>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusObat(${id})`}
  ]);
}

async function _konfirmasiHapusObat(id) {
  try {
    const res = await apiPost('obat.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('stok-obat');
  } catch (e) { showToast(e.message, 'error'); }
}
