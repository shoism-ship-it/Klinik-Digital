let _editRmId = null;
let _rmData   = [];
let _rmAllData = [];
let _rmResepItems = [];
const _rmPreviewLimit = 10;

async function renderRekamMedis() {
  const body = document.getElementById('content-body');
  _rmAllData = await apiGet('rekam_medis.php', { action: 'list' });
  _rmData = _rmAllData.slice(0, _rmPreviewLimit);
  body.innerHTML = _buildRmPage(_rmData);
}

function _buildRmPage(data) {
  const showDoctor = currentRole === 'admin';
  const canManage = currentRole !== 'admin';
  return `
  <div class="section-header">
    <div><h2>Rekam Medis</h2><p>${canManage ? 'Input dan riwayat rekam medis pasien' : 'Riwayat rekam medis pasien'}</p></div>
    <div class="section-header-actions">
      <div class="search-bar" style="width:200px;"><i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Cari ID rekam medis..." oninput="filterRm(this.value)">
      </div>
      ${canManage ? `<button class="btn btn-primary" onclick="openFormRekamMedis()"><i class="fa-solid fa-plus"></i> Input Rekam Medis</button>` : ''}
    </div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Pasien</th>${showDoctor ? '<th>Dokter</th>' : ''}<th>Tanggal</th><th>Diagnosa</th><th>Aksi</th></tr></thead>
        <tbody id="tbody-rm">${_rowsRm(data, _rmAllData.length > _rmPreviewLimit)}</tbody>
      </table>
    </div>
  </div>`;
}

function _rowsRm(data, hasMore = false) {
  const showDoctor = currentRole === 'admin';
  const canManage = currentRole !== 'admin';
  if (!data.length) return _emptyRmRow('Data rekam medis tidak ditemukan. Periksa No ID yang dimasukkan.');
  const rows = data.map(r => `<tr>
    <td><span class="badge badge-muted">${r.kode}</span></td>
    <td><strong>${r.nama_pasien}</strong></td>
    ${showDoctor ? `<td>${r.nama_dokter}</td>` : ''}
    <td>${r.tanggal}</td>
    <td>${r.diagnosa}</td>
    <td>
      <button class="btn btn-xs btn-secondary" onclick="detailRekamMedis(${r.id})"><i class="fa-solid fa-eye"></i> Detail</button>
      ${canManage ? `<button class="btn btn-xs btn-outline" onclick="openFormRekamMedis(${r.id})"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-xs btn-danger" onclick="hapusRm(${r.id},'${r.kode}')"><i class="fa-solid fa-trash"></i></button>` : ''}
    </td>
  </tr>`).join('');
  return rows + (hasMore ? _infoRmRow(`Menampilkan ${_rmPreviewLimit} data pertama. Gunakan pencarian ID untuk melihat data lainnya.`) : '');
}

function _emptyRmRow(message) {
  const showDoctor = currentRole === 'admin';
  return `<tr><td colspan="${showDoctor ? 6 : 5}" style="text-align:center;color:var(--text-light);padding:20px;">${message}</td></tr>`;
}

function _infoRmRow(message) {
  const showDoctor = currentRole === 'admin';
  return `<tr><td colspan="${showDoctor ? 6 : 5}" style="text-align:center;color:var(--text-light);font-size:12px;padding:12px;">${message}</td></tr>`;
}

async function filterRm(q) {
  const tbody = document.getElementById('tbody-rm');
  const id = q.trim();
  if (!id) {
    _rmData = _rmAllData.slice(0, _rmPreviewLimit);
    if (tbody) tbody.innerHTML = _rowsRm(_rmData, _rmAllData.length > _rmPreviewLimit);
    return;
  }
  try {
    const data = await apiGet('rekam_medis.php', { action: 'list', q });
    _rmData = data;
    if (tbody) tbody.innerHTML = _rowsRm(data);
  } catch (_) {}
}

async function openFormRekamMedis(id = null) {
  _editRmId = id;
  let r = { pasien_id:'', dokter_id:'', tanggal: new Date().toISOString().split('T')[0], keluhan:'', diagnosa:'', tindakan:'', tekanan_darah:'', berat_badan:'' };
  if (id) {
    try { r = await apiGet('rekam_medis.php', { action: 'get', id }); } catch (_) {}
  }
  _rmResepItems = [{ nama_obat:'', jumlah:1, aturan:'' }];

  const pasienOpts = _pasienList.map(p => `<option value="${p.id}" ${r.pasien_id==p.id?'selected':''}>${p.nama}</option>`).join('');
  const dokterLogin = currentDokter();
  if (!id && currentRole === 'dokter' && dokterLogin) {
    r.dokter_id = dokterLogin.id;
  }
  const dokterOpts = _dokterList.map(d => `<option value="${d.id}" ${r.dokter_id==d.id?'selected':''}>${d.nama}</option>`).join('');

  openModal(id ? 'Edit Rekam Medis' : 'Input Rekam Medis Baru', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pasien *</label>
        <select id="frm-rm-pasien" class="form-control">${pasienOpts}</select>
      </div>
      ${currentRole === 'admin' ? `<div class="form-group">
        <label class="form-label">Dokter *</label>
        <select id="frm-rm-dokter" class="form-control">${dokterOpts}</select>
      </div>` : `<div class="form-group">
        <label class="form-label">Dokter</label>
        <input type="text" class="form-control" value="${dokterLogin?.nama || currentName}" disabled>
        <input type="hidden" id="frm-rm-dokter" value="${r.dokter_id || dokterLogin?.id || ''}">
      </div>`}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tanggal</label>
        <input type="date" id="frm-rm-tgl" class="form-control" value="${r.tanggal||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Tekanan Darah</label>
        <input type="text" id="frm-rm-td" class="form-control" placeholder="120/80" value="${r.tekanan_darah||''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Keluhan *</label>
      <textarea id="frm-rm-keluhan" class="form-control" rows="2">${r.keluhan||''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Diagnosa *</label>
      <input type="text" id="frm-rm-diagnosa" class="form-control" value="${r.diagnosa||''}">
    </div>
    <div class="form-group">
      <label class="form-label">Tindakan</label>
      <textarea id="frm-rm-tindakan" class="form-control" rows="2">${r.tindakan||''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Berat Badan (kg)</label>
      <input type="number" step="0.1" id="frm-rm-bb" class="form-control" value="${r.berat_badan||''}">
    </div>
    ${!id ? `
    <div class="separator"></div>
    <div class="resep-section-title"><i class="fa-solid fa-file-prescription"></i> Resep Obat</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Berlaku Sampai</label>
        <input type="datetime-local" id="frm-rm-berlaku" class="form-control" value="${defaultResepExpiry()}">
      </div>
      <div class="form-group">
        <label class="form-label">Catatan Resep</label>
        <input type="text" id="frm-rm-resep-catatan" class="form-control" placeholder="Opsional">
      </div>
    </div>
    <div id="rm-resep-items-list">${_rmResepItems.map((item, i) => _rmResepItemHtml(item, i)).join('')}</div>
    <button class="btn btn-outline btn-sm" style="margin-top:6px;" onclick="tambahItemRmResep()">
      <i class="fa-solid fa-plus"></i> Tambah Obat
    </button>` : ''}
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveFormRekamMedis()'}
  ]);
}

async function saveFormRekamMedis() {
  const keluhan  = val('frm-rm-keluhan');
  const diagnosa = val('frm-rm-diagnosa');
  if (!keluhan)  { showToast('Keluhan wajib diisi!', 'error'); return; }
  if (!diagnosa) { showToast('Diagnosa wajib diisi!', 'error'); return; }
  const payload = {
    id: _editRmId || undefined,
    pasien_id:     val('frm-rm-pasien'),
    dokter_id:     val('frm-rm-dokter'),
    tanggal:       val('frm-rm-tgl'),
    keluhan, diagnosa,
    tindakan:      val('frm-rm-tindakan'),
    tekanan_darah: val('frm-rm-td'),
    berat_badan:   val('frm-rm-bb'),
  };
  if (!_editRmId) {
    _syncRmResepItems();
    payload.berlaku_sampai = val('frm-rm-berlaku');
    payload.resep_catatan = val('frm-rm-resep-catatan');
    payload.resep_detail = _rmResepItems
      .map(item => ({
        nama_obat: item.nama_obat.trim(),
        jumlah: item.jumlah || 1,
        aturan: item.aturan || '',
      }))
      .filter(item => item.nama_obat);
  }
  try {
    const res = await apiPost('rekam_medis.php', _editRmId ? 'update' : 'create', payload);
    showToast(res.msg, 'success');
    closeModal();
    renderSection('rekam-medis');
  } catch (e) { showToast(e.message, 'error'); }
}

function hapusRm(id, kode) {
  openModal('Hapus Rekam Medis', `
    <p style="text-align:center;padding:12px 0;">Yakin ingin menghapus rekam medis <strong>${kode}</strong>?</p>
    <p style="text-align:center;font-size:12px;color:var(--text-light);">Tindakan ini tidak dapat dibatalkan.</p>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusRm(${id})`}
  ]);
}

async function _konfirmasiHapusRm(id) {
  try {
    const res = await apiPost('rekam_medis.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('rekam-medis');
  } catch (e) { showToast(e.message, 'error'); }
}

async function detailRekamMedis(id) {
  let r = _rmData.find(x => x.id === id);
  if (!r) {
    try { r = await apiGet('rekam_medis.php', { action: 'get', id }); } catch (_) { return; }
  }
  const resep = r.resep || null;
  openModal('Detail Rekam Medis — ' + r.kode, `
    <div class="grid-2">
      <div class="detail-field"><label>Pasien</label><div class="val">${r.nama_pasien||r.pasien_id}</div></div>
      ${currentRole === 'admin' ? `<div class="detail-field"><label>Dokter</label><div class="val">${r.nama_dokter||r.dokter_id}</div></div>` : ''}
      <div class="detail-field"><label>Tanggal</label><div class="val">${r.tanggal}</div></div>
      <div class="detail-field"><label>Tekanan Darah</label><div class="val">${r.tekanan_darah||'-'}</div></div>
      <div class="detail-field"><label>Berat Badan</label><div class="val">${r.berat_badan ? r.berat_badan+' kg' : '-'}</div></div>
      <div class="detail-field"><label>Diagnosa</label><div class="val">${r.diagnosa}</div></div>
    </div>
    <div class="separator"></div>
    <div class="detail-field"><label>Keluhan</label><div class="val">${r.keluhan}</div></div>
    <div class="detail-field"><label>Tindakan</label><div class="val">${r.tindakan||'-'}</div></div>
    ${resep ? `
      <div class="separator"></div>
      <div class="resep-section-title"><i class="fa-solid fa-file-prescription"></i> Resep Obat</div>
      <div class="grid-2" style="margin-bottom:12px;">
        <div class="detail-field"><label>ID Resep</label><div class="val">${resep.kode}</div></div>
        <div class="detail-field"><label>Berlaku Sampai</label><div class="val">${resep.berlaku_sampai || '-'}</div></div>
      </div>
      ${resep.catatan ? `<div class="detail-field"><label>Catatan Resep</label><div class="val">${esc(resep.catatan)}</div></div>` : ''}
      ${(resep.detail || []).map((d, i) => `
        <div style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:8px;">
          <div style="font-size:11px;font-weight:700;color:var(--text-light);margin-bottom:8px;">OBAT ${i + 1}</div>
          <div class="grid-2">
            <div class="detail-field"><label>Nama Obat</label><div class="val">${esc(d.nama_obat)}</div></div>
            <div class="detail-field"><label>Jumlah</label><div class="val">${esc(d.jumlah)}</div></div>
            <div class="detail-field"><label>Aturan Pakai</label><div class="val">${esc(d.aturan || '-')}</div></div>
          </div>
        </div>`).join('')}
    ` : ''}
  `, [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}]);
}

function defaultResepExpiry() {
  const d = new Date();
  d.setHours(d.getHours() + 24, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function _rmResepItemHtml(item, i) {
  return `
  <div class="resep-item-block" id="rm-resep-item-${i}" style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:11px;font-weight:700;color:var(--text-light);">OBAT ${i + 1}</span>
      ${i > 0 ? `<button class="btn btn-xs btn-danger" onclick="hapusItemRmResep(${i})"><i class="fa-solid fa-xmark"></i></button>` : ''}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nama Obat</label>
        <input type="text" id="frm-rm-obat-${i}" class="form-control" placeholder="Contoh: Amoxicillin 500 mg" value="${esc(item.nama_obat || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Jumlah</label>
        <input type="number" id="frm-rm-jml-${i}" class="form-control" value="${item.jumlah || 1}" min="1">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Aturan Pakai</label>
      <input type="text" id="frm-rm-aturan-${i}" class="form-control" placeholder="3x1 sesudah makan" value="${esc(item.aturan || '')}">
    </div>
  </div>`;
}

function _syncRmResepItems() {
  _rmResepItems.forEach((_, i) => {
    _rmResepItems[i].nama_obat = document.getElementById(`frm-rm-obat-${i}`)?.value || '';
    _rmResepItems[i].jumlah = parseInt(document.getElementById(`frm-rm-jml-${i}`)?.value) || 1;
    _rmResepItems[i].aturan = document.getElementById(`frm-rm-aturan-${i}`)?.value || '';
  });
}

function tambahItemRmResep() {
  _syncRmResepItems();
  _rmResepItems.push({ nama_obat:'', jumlah:1, aturan:'' });
  const listEl = document.getElementById('rm-resep-items-list');
  if (listEl) listEl.innerHTML = _rmResepItems.map((item, i) => _rmResepItemHtml(item, i)).join('');
}

function hapusItemRmResep(i) {
  _syncRmResepItems();
  _rmResepItems.splice(i, 1);
  const listEl = document.getElementById('rm-resep-items-list');
  if (listEl) listEl.innerHTML = _rmResepItems.map((item, idx) => _rmResepItemHtml(item, idx)).join('');
}
