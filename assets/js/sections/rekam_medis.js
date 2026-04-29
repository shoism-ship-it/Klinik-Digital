let _editRmId = null;
let _rmData   = [];

async function renderRekamMedis() {
  const body = document.getElementById('content-body');
  _rmData = await apiGet('rekam_medis.php', { action: 'list' });
  body.innerHTML = _buildRmPage(_rmData);
}

function _buildRmPage(data) {
  return `
  <div class="section-header">
    <div><h2>Rekam Medis</h2><p>Input dan riwayat rekam medis pasien</p></div>
    <div class="section-header-actions">
      <div class="search-bar" style="width:200px;"><i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Cari rekam medis..." oninput="filterRm(this.value)">
      </div>
      <button class="btn btn-primary" onclick="openFormRekamMedis()"><i class="fa-solid fa-plus"></i> Input Rekam Medis</button>
    </div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Pasien</th><th>Dokter</th><th>Tanggal</th><th>Diagnosa</th><th>Aksi</th></tr></thead>
        <tbody id="tbody-rm">${_rowsRm(data)}</tbody>
      </table>
    </div>
  </div>`;
}

function _rowsRm(data) {
  if (!data.length) return '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada rekam medis.</td></tr>';
  return data.map(r => `<tr>
    <td><span class="badge badge-muted">${r.kode}</span></td>
    <td><strong>${r.nama_pasien}</strong></td>
    <td>${r.nama_dokter}</td>
    <td>${r.tanggal}</td>
    <td>${r.diagnosa}</td>
    <td>
      <button class="btn btn-xs btn-secondary" onclick="detailRekamMedis(${r.id})"><i class="fa-solid fa-eye"></i> Detail</button>
      <button class="btn btn-xs btn-outline" onclick="openFormRekamMedis(${r.id})"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-xs btn-danger" onclick="hapusRm(${r.id},'${r.kode}')"><i class="fa-solid fa-trash"></i></button>
    </td>
  </tr>`).join('');
}

async function filterRm(q) {
  try {
    const data = await apiGet('rekam_medis.php', { action: 'list', q });
    const tbody = document.getElementById('tbody-rm');
    if (tbody) tbody.innerHTML = _rowsRm(data);
  } catch (_) {}
}

async function openFormRekamMedis(id = null) {
  _editRmId = id;
  let r = { pasien_id:'', dokter_id:'', tanggal: new Date().toISOString().split('T')[0], keluhan:'', diagnosa:'', tindakan:'', tekanan_darah:'', berat_badan:'' };
  if (id) {
    try { r = await apiGet('rekam_medis.php', { action: 'get', id }); } catch (_) {}
  }

  const pasienOpts = _pasienList.map(p => `<option value="${p.id}" ${r.pasien_id==p.id?'selected':''}>${p.nama}</option>`).join('');
  const dokterOpts = _dokterList.map(d => `<option value="${d.id}" ${r.dokter_id==d.id?'selected':''}>${d.nama}</option>`).join('');

  openModal(id ? 'Edit Rekam Medis' : 'Input Rekam Medis Baru', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pasien *</label>
        <select id="frm-rm-pasien" class="form-control">${pasienOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Dokter *</label>
        <select id="frm-rm-dokter" class="form-control">${dokterOpts}</select>
      </div>
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
  openModal('Detail Rekam Medis — ' + r.kode, `
    <div class="grid-2">
      <div class="detail-field"><label>Pasien</label><div class="val">${r.nama_pasien||r.pasien_id}</div></div>
      <div class="detail-field"><label>Dokter</label><div class="val">${r.nama_dokter||r.dokter_id}</div></div>
      <div class="detail-field"><label>Tanggal</label><div class="val">${r.tanggal}</div></div>
      <div class="detail-field"><label>Tekanan Darah</label><div class="val">${r.tekanan_darah||'-'}</div></div>
      <div class="detail-field"><label>Berat Badan</label><div class="val">${r.berat_badan ? r.berat_badan+' kg' : '-'}</div></div>
      <div class="detail-field"><label>Diagnosa</label><div class="val">${r.diagnosa}</div></div>
    </div>
    <div class="separator"></div>
    <div class="detail-field"><label>Keluhan</label><div class="val">${r.keluhan}</div></div>
    <div class="detail-field"><label>Tindakan</label><div class="val">${r.tindakan||'-'}</div></div>
  `, [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}]);
}
