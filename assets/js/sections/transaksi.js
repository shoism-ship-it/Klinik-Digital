let _transaksiData = [];
let _editTransaksiId = null;

async function renderTransaksi() {
  const body = document.getElementById('content-body');
  _transaksiData = await apiGet('transaksi.php', { action: 'list' });
  body.innerHTML = _buildTransaksiPage(_transaksiData);
}

function _buildTransaksiPage(data) {
  const totalPendapatan = data.reduce((s, t) => s + (parseInt(t.total)||0), 0);
  const gratisSubsidi   = data.filter(t => parseInt(t.total) === 0).length;
  return `
  <div class="section-header">
    <div><h2>${currentRole === 'pasien' ? 'Transaksi Saya' : 'Transaksi'}</h2><p>${currentRole === 'pasien' ? 'Status pembayaran dan QRIS simulasi layanan Anda' : 'Riwayat transaksi layanan klinik kampus'}</p></div>
    <div class="section-header-actions">
      ${currentRole === 'admin' ? `<button class="btn btn-primary" onclick="openFormTransaksi()"><i class="fa-solid fa-plus"></i> Tambah Transaksi</button>` : ''}
    </div>
  </div>
  <div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-receipt"></i></div><div><div class="stat-val">${data.length}</div><div class="stat-lbl">Total Transaksi</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-hand-holding-heart"></i></div><div><div class="stat-val">${gratisSubsidi}</div><div class="stat-lbl">Gratis / Subsidi</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-money-bill"></i></div><div><div class="stat-val">${fmtRupiah(totalPendapatan)}</div><div class="stat-lbl">Total Pendapatan</div></div></div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Tanggal</th>${currentRole !== 'pasien' ? '<th>Pasien</th>' : ''}<th>Layanan</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.length === 0
            ? `<tr><td colspan="${currentRole === 'pasien' ? 6 : 7}" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada transaksi.</td></tr>`
            : data.map(t=>`<tr>
                <td><span class="badge badge-muted">${t.kode}</span></td>
                <td>${t.tanggal}</td>
                ${currentRole !== 'pasien' ? `<td><strong>${t.nama_pasien}</strong></td>` : ''}
                <td>${t.layanan}</td>
                <td>${parseInt(t.total)===0?'<span class="badge badge-success">Gratis</span>':`<strong>${fmtRupiah(t.total)}</strong>`}</td>
                <td><span class="badge badge-success">${t.status}</span></td>
                <td>
                  <button class="btn btn-xs btn-secondary" onclick="detailTransaksi(${t.id})"><i class="fa-solid fa-eye"></i> Detail</button>
                  ${currentRole === 'admin' ? `<button class="btn btn-xs btn-outline" onclick="openFormTransaksi(${t.id})"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-xs btn-danger" onclick="hapusTransaksi(${t.id},'${t.kode}')"><i class="fa-solid fa-trash"></i></button>` : ''}
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function openFormTransaksi(id = null) {
  _editTransaksiId = id;
  const trx = id ? _transaksiData.find(x => x.id === id) : null;
  const today = new Date().toISOString().split('T')[0];
  const pasienId = trx?.pasien_id || _pasienList[0]?.id || '';
  const tanggal = trx?.tanggal || today;
  const layanan = trx?.layanan || 'Konsultasi Umum';
  const status = trx?.status || 'Selesai';
  const total = parseInt(trx?.total || 0);
  const pasienOpts = _pasienList.map(p => `<option value="${p.id}" ${String(p.id)===String(pasienId)?'selected':''}>${p.nama}</option>`).join('');
  openModal(id ? 'Edit Transaksi' : 'Tambah Transaksi', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pasien *</label>
        <select id="frm-trx-pasien" class="form-control">${pasienOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal</label>
        <input type="date" id="frm-trx-tgl" class="form-control" value="${tanggal}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Layanan</label>
        <select id="frm-trx-layanan" class="form-control">
          ${['Konsultasi Umum','Konsultasi Gigi','Laboratorium','Konseling','Fisioterapi','Pengambilan Obat'].map(o=>`<option ${o===layanan?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Total Biaya (Rp)</label>
        <input type="number" id="frm-trx-total" class="form-control" value="${total}" min="0">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="frm-trx-status" class="form-control">
        ${['Selesai','Menunggu','Batal'].map(o=>`<option ${o===status?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveFormTransaksi()'}
  ]);
}

async function saveFormTransaksi() {
  const pasien_id = val('frm-trx-pasien');
  const metode    = parseInt(val('frm-trx-total')) === 0 ? 'Gratis' : 'QRIS Simulasi';
  if (!pasien_id) { showToast('Pilih pasien!', 'error'); return; }
  const payload = {
    id: _editTransaksiId || undefined,
    pasien_id, tanggal: val('frm-trx-tgl'),
    layanan: val('frm-trx-layanan'), metode,
    total: metode === 'Gratis' ? 0 : (parseInt(val('frm-trx-total'))||0),
    status: val('frm-trx-status'),
  };
  try {
    const res = await apiPost('transaksi.php', _editTransaksiId ? 'update' : 'create', payload);
    closeModal();
    showToast(res.msg, 'success');
    renderSection('transaksi');
  } catch (e) { showToast(e.message, 'error'); }
}

function detailTransaksi(id) {
  const t = _transaksiData.find(x => x.id === id);
  if (!t) return;
  openModal('Detail Transaksi — ' + t.kode, `
    <div class="grid-2">
      <div class="detail-field"><label>ID</label><div class="val">${t.kode}</div></div>
      <div class="detail-field"><label>Tanggal</label><div class="val">${t.tanggal}</div></div>
      ${currentRole !== 'pasien' ? `<div class="detail-field"><label>Pasien</label><div class="val">${t.nama_pasien}</div></div>` : ''}
      <div class="detail-field"><label>Layanan</label><div class="val">${t.layanan}</div></div>
      <div class="detail-field"><label>Total</label><div class="val">${parseInt(t.total)===0?'<span class="badge badge-success">Gratis</span>':`<strong>${fmtRupiah(t.total)}</strong>`}</div></div>
      <div class="detail-field"><label>Status</label><div class="val"><span class="badge badge-success">${t.status}</span></div></div>
    </div>
    ${parseInt(t.total) > 0 ? `
    <div class="separator"></div>
    <div class="qris-box">
      <div class="qris-visual" aria-label="QRIS Simulasi">${qrisSimulationSvg(t.kode)}</div>
      <div>
        <h4>QRIS Simulasi</h4>
        <p>Scan simulasi untuk transaksi ${t.kode}. Status pembayaran dikonfirmasi admin.</p>
        <span class="badge badge-info">${fmtRupiah(t.total)}</span>
      </div>
    </div>` : ''}
  `, [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}]);
}

function qrisSimulationSvg(kode) {
  const bits = String(kode).split('').map(c => c.charCodeAt(0));
  let cells = '';
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const on = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5) || ((bits[(x + y) % bits.length] + x * y) % 3 === 0);
      cells += `<span class="${on ? 'on' : ''}"></span>`;
    }
  }
  return `<div class="qris-grid">${cells}</div><strong>QRIS</strong>`;
}

function hapusTransaksi(id, kode) {
  openModal('Hapus Transaksi', `
    <p style="text-align:center;padding:12px 0;">Yakin hapus transaksi <strong>${kode}</strong>?</p>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusTrx(${id})`}
  ]);
}

async function _konfirmasiHapusTrx(id) {
  try {
    const res = await apiPost('transaksi.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('transaksi');
  } catch (e) { showToast(e.message, 'error'); }
}
