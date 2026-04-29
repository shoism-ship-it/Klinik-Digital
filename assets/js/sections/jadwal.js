let _editJadwalId = null;
let _jadwalData   = [];

async function renderJadwal() {
  const body = document.getElementById('content-body');
  _jadwalData = await apiGet('jadwal.php', { action: 'list' });
  body.innerHTML = _buildJadwalPage(_jadwalData);
}

function _buildJadwalPage(data) {
  // Group by hari untuk grid kalender
  const hariOrder = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const grouped   = {};
  hariOrder.forEach(h => { grouped[h] = []; });
  data.forEach(j => {
    if (grouped[j.hari]) grouped[j.hari].push(j);
    else { grouped[j.hari] = [j]; }
  });

  const hariAda = hariOrder.filter(h => grouped[h] && grouped[h].length > 0);

  return `
  <div class="section-header">
    <div><h2>Jadwal Praktik</h2><p>Jadwal dan ketersediaan dokter per hari</p></div>
    <div class="section-header-actions">
      ${currentRole === 'admin'
        ? `<button class="btn btn-primary" onclick="openFormJadwal()"><i class="fa-solid fa-plus"></i> Tambah Jadwal</button>`
        : ''}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(${Math.min(hariAda.length||5,5)},1fr);gap:12px;margin-bottom:16px;">
    ${hariAda.map(h=>`
    <div class="schedule-day">
      <div class="schedule-day-header"><i class="fa-solid fa-calendar-day" style="margin-right:6px;"></i>${h}</div>
      ${grouped[h].map(j=>`
      <div class="schedule-slot">
        <i class="fa-solid fa-user-doctor"></i>
        ${j.nama_dokter} — ${j.jam}
      </div>`).join('')}
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-header"><h3><i class="fa-solid fa-table"></i> Detail Jadwal</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Dokter</th><th>Spesialis</th><th>Hari</th><th>Jam Mulai</th><th>Jam Selesai</th><th>Kuota</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.length === 0
            ? '<tr><td colspan="9" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada jadwal.</td></tr>'
            : data.map(j=>`<tr>
                <td><span class="badge badge-muted">${j.kode}</span></td>
                <td><strong>${j.nama_dokter}</strong></td>
                <td>${j.spesialis}</td>
                <td>${j.hari}</td>
                <td>${j.jam_mulai ? j.jam_mulai.slice(0,5) : '-'}</td>
                <td>${j.jam_selesai ? j.jam_selesai.slice(0,5) : '-'}</td>
                <td>${j.kuota} pasien</td>
                <td><span class="badge ${j.status==='Aktif'?'badge-success':'badge-secondary'}">${j.status}</span></td>
                <td>
                  ${currentRole === 'admin'
                    ? `<button class="btn btn-xs btn-outline" onclick="openFormJadwal(${j.id})"><i class="fa-solid fa-pen"></i> Edit</button>
                       <button class="btn btn-xs btn-danger" onclick="hapusJadwal(${j.id},'${j.kode}')"><i class="fa-solid fa-trash"></i></button>`
                    : '-'}
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function openFormJadwal(id = null) {
  _editJadwalId = id;
  let j = { dokter_id:'', hari:'Senin', jam_mulai:'08:00', jam_selesai:'12:00', kuota:10, status:'Aktif' };
  if (id) {
    try { j = await apiGet('jadwal.php', { action: 'get', id }); } catch (_) {}
  }
  const dokterOpts = _dokterList.map(d => `<option value="${d.id}" ${j.dokter_id==d.id?'selected':''}>${d.nama}</option>`).join('');
  openModal(id ? 'Edit Jadwal' : 'Tambah Jadwal Praktik', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Dokter *</label>
        <select id="frm-j-dokter" class="form-control">${dokterOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Hari *</label>
        <select id="frm-j-hari" class="form-control">
          ${['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(h=>`<option ${j.hari===h?'selected':''}>${h}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Jam Mulai *</label>
        <input type="time" id="frm-j-mulai" class="form-control" value="${(j.jam_mulai||'08:00').slice(0,5)}">
      </div>
      <div class="form-group">
        <label class="form-label">Jam Selesai *</label>
        <input type="time" id="frm-j-selesai" class="form-control" value="${(j.jam_selesai||'12:00').slice(0,5)}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Kuota Pasien</label>
        <input type="number" id="frm-j-kuota" class="form-control" min="1" value="${j.kuota||10}">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="frm-j-status" class="form-control">
          <option ${(j.status||'Aktif')==='Aktif'?'selected':''}>Aktif</option>
          <option ${j.status==='Nonaktif'?'selected':''}>Nonaktif</option>
        </select>
      </div>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveFormJadwal()'}
  ]);
}

async function saveFormJadwal() {
  const dokter_id   = val('frm-j-dokter');
  const hari        = val('frm-j-hari');
  const jam_mulai   = val('frm-j-mulai');
  const jam_selesai = val('frm-j-selesai');
  if (!dokter_id || !hari || !jam_mulai || !jam_selesai) {
    showToast('Dokter, hari, dan jam wajib diisi!', 'error'); return;
  }
  const payload = {
    id: _editJadwalId || undefined,
    dokter_id, hari, jam_mulai, jam_selesai,
    kuota: parseInt(val('frm-j-kuota'))||10,
    status: val('frm-j-status'),
  };
  try {
    const res = await apiPost('jadwal.php', _editJadwalId ? 'update' : 'create', payload);
    showToast(res.msg, 'success');
    closeModal();
    renderSection('jadwal');
  } catch (e) { showToast(e.message, 'error'); }
}

function hapusJadwal(id, kode) {
  openModal('Hapus Jadwal', `
    <p style="text-align:center;padding:12px 0;">Yakin hapus jadwal <strong>${kode}</strong>?</p>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusJadwal(${id})`}
  ]);
}

async function _konfirmasiHapusJadwal(id) {
  try {
    const res = await apiPost('jadwal.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('jadwal');
  } catch (e) { showToast(e.message, 'error'); }
}
