let _resepItems  = [];
let _editResepId = null;
let _resepData   = [];

async function renderResepObat() {
  const body = document.getElementById('content-body');
  _resepData = await apiGet('resep.php', { action: 'list' });
  body.innerHTML = _buildResepPage(_resepData);
}

function _buildResepPage(data) {
  return `
  <div class="section-header">
    <div><h2>Resep Obat</h2><p>Manajemen resep dan pengeluaran obat</p></div>
    <div class="section-header-actions">
      ${currentRole === 'dokter' || currentRole === 'admin'
        ? `<button class="btn btn-primary" onclick="openFormResep()"><i class="fa-solid fa-plus"></i> Buat Resep Baru</button>`
        : ''}
    </div>
  </div>
  <div class="card" style="margin-bottom:16px;">
    <div class="card-header"><h3><i class="fa-solid fa-list-ul"></i> Daftar Resep</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID Resep</th><th>Pasien</th><th>Dokter</th><th>Tanggal</th><th>Jml Obat</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.length === 0
            ? '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada resep.</td></tr>'
            : data.map(r=>`<tr>
                <td><span class="badge badge-muted">${r.kode}</span></td>
                <td><strong>${r.nama_pasien}</strong></td>
                <td>${r.nama_dokter}</td>
                <td>${r.tanggal}</td>
                <td><span class="badge badge-info">${r.detail.length} obat</span></td>
                <td>
                  <button class="btn btn-xs btn-secondary" onclick="detailResep(${r.id})"><i class="fa-solid fa-eye"></i> Detail</button>
                  ${currentRole !== 'pasien'
                    ? `<button class="btn btn-xs btn-danger" onclick="hapusResep(${r.id},'${r.kode}')"><i class="fa-solid fa-trash"></i></button>`
                    : ''}
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <div class="card">
    <div class="card-header"><h3><i class="fa-solid fa-capsules"></i> Daftar Obat Tersedia</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nama Obat</th><th>Kategori</th><th>Stok</th><th>Satuan</th></tr></thead>
        <tbody>
          ${_obatList.map(o=>`<tr>
            <td><strong>${o.nama}</strong></td>
            <td>${o.kategori||'-'}</td>
            <td style="color:${o.stok<10?'var(--danger)':o.stok<30?'var(--warning)':'var(--success)'};font-weight:700;">${o.stok}</td>
            <td>${o.satuan}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function openFormResep() {
  _editResepId = null;
  _resepItems  = [{ obat_id: _obatList[0]?.id||'', jumlah:1, aturan:'' }];
  _renderFormResep();
}

function _renderFormResep() {
  const today      = new Date().toISOString().split('T')[0];
  const pasienOpts = _pasienList.map(p => `<option value="${p.id}">${p.nama}</option>`).join('');
  openModal('Buat Resep Baru', `
    <div class="resep-section-title"><i class="fa-solid fa-file-prescription"></i> A. DATA RESEP</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pasien *</label>
        <select id="frm-rx-pasien" class="form-control">${pasienOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal</label>
        <input type="date" id="frm-rx-tgl" class="form-control" value="${today}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Catatan</label>
      <input type="text" id="frm-rx-catatan" class="form-control" placeholder="Catatan umum resep...">
    </div>
    <div class="resep-section-title" style="margin-top:4px;"><i class="fa-solid fa-capsules"></i> B. DETAIL OBAT</div>
    <div id="resep-items-list">
      ${_resepItems.map((item, i) => _resepItemHtml(item, i)).join('')}
    </div>
    <button class="btn btn-outline btn-sm" style="margin-top:6px;" onclick="tambahItemResep()">
      <i class="fa-solid fa-plus"></i> Tambah Obat
    </button>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan Resep', cls:'btn-primary', action:'saveFormResep()'}
  ], true);
}

function _resepItemHtml(item, i) {
  const obatOpts = _obatList.map(o => `<option value="${o.id}" ${item.obat_id==o.id?'selected':''}>${o.nama} (stok:${o.stok})</option>`).join('');
  return `
  <div class="resep-item-block" id="resep-item-${i}" style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:11px;font-weight:700;color:var(--text-light);">OBAT ${i+1}</span>
      ${i > 0 ? `<button class="btn btn-xs btn-danger" onclick="hapusItemResep(${i})"><i class="fa-solid fa-xmark"></i></button>` : ''}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nama Obat</label>
        <select id="frm-rx-obat-${i}" class="form-control">${obatOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Jumlah</label>
        <input type="number" id="frm-rx-jml-${i}" class="form-control" value="${item.jumlah||1}" min="1">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Aturan Pakai</label>
      <input type="text" id="frm-rx-aturan-${i}" class="form-control" placeholder="3x1 sesudah makan" value="${item.aturan||''}">
    </div>
  </div>`;
}

function _syncResepItems() {
  _resepItems.forEach((_, i) => {
    _resepItems[i].obat_id = document.getElementById(`frm-rx-obat-${i}`)?.value || '';
    _resepItems[i].jumlah  = parseInt(document.getElementById(`frm-rx-jml-${i}`)?.value)||1;
    _resepItems[i].aturan  = document.getElementById(`frm-rx-aturan-${i}`)?.value||'';
  });
}

function tambahItemResep() {
  _syncResepItems();
  _resepItems.push({ obat_id: _obatList[0]?.id||'', jumlah:1, aturan:'' });
  const listEl = document.getElementById('resep-items-list');
  if (listEl) listEl.innerHTML = _resepItems.map((item, i) => _resepItemHtml(item, i)).join('');
}

function hapusItemResep(i) {
  _syncResepItems();
  _resepItems.splice(i, 1);
  const listEl = document.getElementById('resep-items-list');
  if (listEl) listEl.innerHTML = _resepItems.map((item, idx) => _resepItemHtml(item, idx)).join('');
}

async function saveFormResep() {
  _syncResepItems();
  const pasien_id = val('frm-rx-pasien');
  const tanggal   = val('frm-rx-tgl');
  const catatan   = val('frm-rx-catatan');
  const detail    = _resepItems.filter(x => x.obat_id);

  if (!pasien_id) { showToast('Pilih pasien!', 'error'); return; }
  if (!detail.length) { showToast('Tambahkan minimal 1 obat!', 'error'); return; }

  // Cari dokter_id dari nama dokter yang login (jika role dokter)
  let dokter_id = _dokterList[0]?.id || 0;
  if (currentRole === 'dokter') {
    const d = _dokterList.find(x => x.nama === currentName);
    if (d) dokter_id = d.id;
  }

  try {
    const res = await apiPost('resep.php', 'create', { pasien_id, dokter_id, tanggal, catatan, detail });
    closeModal();
    showToast(res.msg, 'success');
    renderSection('resep-obat');
  } catch (e) { showToast(e.message, 'error'); }
}

function hapusResep(id, kode) {
  openModal('Hapus Resep', `
    <p style="text-align:center;padding:12px 0;">Yakin hapus resep <strong>${kode}</strong>?</p>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusResep(${id})`}
  ]);
}

async function _konfirmasiHapusResep(id) {
  try {
    const res = await apiPost('resep.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('resep-obat');
  } catch (e) { showToast(e.message, 'error'); }
}

function detailResep(id) {
  const r = _resepData.find(x => x.id === id);
  if (!r) return;
  openModal('Detail Resep — ' + r.kode, `
    <div class="resep-section-title"><i class="fa-solid fa-file-prescription"></i> A. DATA RESEP</div>
    <div class="grid-2" style="margin-bottom:14px;">
      <div class="detail-field"><label>ID Resep</label><div class="val">${r.kode}</div></div>
      <div class="detail-field"><label>Tanggal</label><div class="val">${r.tanggal}</div></div>
      <div class="detail-field"><label>Pasien</label><div class="val">${r.nama_pasien}</div></div>
      <div class="detail-field"><label>Dokter</label><div class="val">${r.nama_dokter}</div></div>
    </div>
    ${r.catatan ? `<div class="detail-field"><label>Catatan</label><div class="val">${r.catatan}</div></div><div class="separator"></div>` : ''}
    <div class="resep-section-title"><i class="fa-solid fa-list-check"></i> B. DETAIL OBAT</div>
    ${r.detail.map((d,i)=>`
    <div style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:8px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-light);margin-bottom:8px;">OBAT ${i+1}</div>
      <div class="grid-2">
        <div class="detail-field"><label>Nama Obat</label><div class="val">${d.nama_obat}</div></div>
        <div class="detail-field"><label>Jumlah</label><div class="val">${d.jumlah}</div></div>
        <div class="detail-field"><label>Aturan Pakai</label><div class="val">${d.aturan||'-'}</div></div>
      </div>
    </div>`).join('')}
  `, [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}], true);
}
