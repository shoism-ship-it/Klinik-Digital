let _editDokterId = null;
let _dokterData   = [];

async function renderDataDokter() {
  const body = document.getElementById('content-body');
  _dokterData = await apiGet('dokter.php', { action: 'list' });
  _dokterList = _dokterData;
  body.innerHTML = _buildDokterPage(_dokterData);
}

function _buildDokterPage(data) {
  return `
  <div class="section-header">
    <div><h2>Data Dokter</h2><p>Kelola data dokter dan tenaga medis</p></div>
    <div class="section-header-actions">
      <button class="btn btn-primary" onclick="openFormDokter()"><i class="fa-solid fa-user-plus"></i> Tambah Dokter</button>
    </div>
  </div>
  <div class="grid-3" style="margin-bottom:16px;">
    ${data.map(d=>`
    <div class="card">
      <div class="card-body" style="text-align:center;padding:20px;">
        <div style="width:56px;height:56px;background:var(--bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:2px solid var(--border);">
          <i class="fa-solid fa-user-doctor" style="font-size:22px;color:var(--c1);"></i>
        </div>
        <div style="font-weight:700;font-size:14px;color:var(--dark);margin-bottom:3px;">${d.nama}</div>
        <span class="badge badge-info" style="margin-bottom:12px;">${d.spesialis}</span>
        <div class="separator"></div>
        <div class="detail-field"><label>Hari</label><div class="val">${d.hari||'-'}</div></div>
        <div class="detail-field"><label>Jam</label><div class="val">${d.jam||'-'}</div></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-sm btn-outline" style="flex:1" onclick="openFormDokter(${d.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn btn-sm btn-danger" style="flex:1" onclick="hapusDokter(${d.id},'${d.nama.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i> Hapus</button>
        </div>
      </div>
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-header"><h3><i class="fa-solid fa-table-list"></i> Tabel Dokter</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Nama Dokter</th><th>Spesialis</th><th>Hari</th><th>Jam</th><th>No HP</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.map(d=>`<tr>
            <td><span class="badge badge-muted">${d.kode}</span></td>
            <td><strong>${d.nama}</strong></td>
            <td>${d.spesialis}</td>
            <td>${d.hari||'-'}</td>
            <td>${d.jam||'-'}</td>
            <td>${d.hp||'-'}</td>
            <td><span class="badge badge-success">${d.status}</span></td>
            <td>
              <button class="btn btn-xs btn-outline" onclick="openFormDokter(${d.id})"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-xs btn-danger" onclick="hapusDokter(${d.id},'${d.nama.replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function openFormDokter(id = null) {
  _editDokterId = id;
  let d = { nama:'', spesialis:'Umum', hari:'', jam:'', hp:'', status:'Aktif' };
  if (id) {
    try { d = await apiGet('dokter.php', { action: 'get', id }); } catch (_) {}
  }
  openModal(id ? 'Edit Data Dokter' : 'Tambah Data Dokter', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nama Dokter *</label>
        <div class="input-wrap"><i class="pre fa-solid fa-user-doctor"></i><input type="text" id="frm-d-nama" class="form-control" placeholder="dr. Nama Lengkap" value="${d.nama||''}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Spesialis</label>
        <select id="frm-d-spesialis" class="form-control">
          ${['Umum','Gigi','THT','Kulit','Anak','Kandungan','Mata'].map(o=>`<option ${d.spesialis===o?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Hari Praktik</label>
        <input type="text" id="frm-d-hari" class="form-control" placeholder="Senin, Rabu, Jumat" value="${d.hari||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Jam Praktik</label>
        <select id="frm-d-jam" class="form-control">
          ${['08:00 - 12:00','13:00 - 17:00','08:00 - 17:00'].map(o=>`<option ${d.jam===o?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">No HP</label>
        <div class="input-wrap"><i class="pre fa-solid fa-phone"></i><input type="tel" id="frm-d-hp" class="form-control" value="${d.hp||''}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="frm-d-status" class="form-control">
          <option ${(d.status||'Aktif')==='Aktif'?'selected':''}>Aktif</option>
          <option ${d.status==='Tidak Aktif'?'selected':''}>Tidak Aktif</option>
        </select>
      </div>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveFormDokter()'}
  ]);
}

async function saveFormDokter() {
  const nama = val('frm-d-nama');
  if (!nama) { showToast('Nama dokter wajib diisi!', 'error'); return; }
  const payload = {
    id: _editDokterId || undefined,
    nama, spesialis: val('frm-d-spesialis'),
    hari: val('frm-d-hari'), jam: val('frm-d-jam'),
    hp: val('frm-d-hp'), status: val('frm-d-status'),
  };
  try {
    const res = await apiPost('dokter.php', _editDokterId ? 'update' : 'create', payload);
    showToast(res.msg, 'success');
    closeModal();
    renderSection('data-dokter');
  } catch (e) { showToast(e.message, 'error'); }
}

function hapusDokter(id, nama) {
  openModal('Hapus Dokter', `
    <p style="text-align:center;padding:12px 0;">Yakin ingin menghapus data <strong>${nama}</strong>?</p>
    <p style="text-align:center;font-size:12px;color:var(--text-light);">Tindakan ini tidak dapat dibatalkan.</p>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusDokter(${id})`}
  ]);
}

async function _konfirmasiHapusDokter(id) {
  try {
    const res = await apiPost('dokter.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('data-dokter');
  } catch (e) { showToast(e.message, 'error'); }
}
