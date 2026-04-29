let _transaksiData = [];

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
    <div><h2>Transaksi</h2><p>Riwayat transaksi layanan klinik kampus</p></div>
    <div class="section-header-actions">
      <button class="btn btn-primary" onclick="openFormTransaksi()"><i class="fa-solid fa-plus"></i> Tambah Transaksi</button>
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
        <thead><tr><th>ID</th><th>Tanggal</th><th>Pasien</th><th>Layanan</th><th>Total</th><th>Metode</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.length === 0
            ? '<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada transaksi.</td></tr>'
            : data.map(t=>`<tr>
                <td><span class="badge badge-muted">${t.kode}</span></td>
                <td>${t.tanggal}</td>
                <td><strong>${t.nama_pasien}</strong></td>
                <td>${t.layanan}</td>
                <td>${parseInt(t.total)===0?'<span class="badge badge-success">Gratis</span>':`<strong>${fmtRupiah(t.total)}</strong>`}</td>
                <td><span class="badge badge-info">${t.metode}</span></td>
                <td><span class="badge badge-success">${t.status}</span></td>
                <td>
                  <button class="btn btn-xs btn-secondary" onclick="detailTransaksi(${t.id})"><i class="fa-solid fa-eye"></i></button>
                  <button class="btn btn-xs btn-danger" onclick="hapusTransaksi(${t.id},'${t.kode}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function openFormTransaksi() {
  const today      = new Date().toISOString().split('T')[0];
  const pasienOpts = _pasienList.map(p => `<option value="${p.id}">${p.nama}</option>`).join('');
  openModal('Tambah Transaksi', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pasien *</label>
        <select id="frm-trx-pasien" class="form-control">${pasienOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal</label>
        <input type="date" id="frm-trx-tgl" class="form-control" value="${today}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Layanan</label>
        <select id="frm-trx-layanan" class="form-control">
          ${['Konsultasi Umum','Konsultasi Gigi','Laboratorium','Konseling','Fisioterapi'].map(o=>`<option>${o}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Metode Pembayaran</label>
        <select id="frm-trx-metode" class="form-control" onchange="toggleTotalField(this.value)">
          <option>BPJS</option><option>Tunai</option><option>Transfer</option><option>Gratis</option>
        </select>
      </div>
    </div>
    <div class="form-group" id="total-field">
      <label class="form-label">Total Biaya (Rp)</label>
      <input type="number" id="frm-trx-total" class="form-control" value="0" min="0">
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="frm-trx-status" class="form-control">
        <option>Selesai</option><option>Menunggu</option><option>Batal</option>
      </select>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:'saveFormTransaksi()'}
  ]);
}

function toggleTotalField(metode) {
  const tf = document.getElementById('total-field');
  if (tf) tf.style.display = metode === 'Gratis' ? 'none' : 'block';
}

async function saveFormTransaksi() {
  const pasien_id = val('frm-trx-pasien');
  const metode    = val('frm-trx-metode');
  if (!pasien_id) { showToast('Pilih pasien!', 'error'); return; }
  const payload = {
    pasien_id, tanggal: val('frm-trx-tgl'),
    layanan: val('frm-trx-layanan'), metode,
    total: metode === 'Gratis' ? 0 : (parseInt(val('frm-trx-total'))||0),
    status: val('frm-trx-status'),
  };
  try {
    const res = await apiPost('transaksi.php', 'create', payload);
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
      <div class="detail-field"><label>Pasien</label><div class="val">${t.nama_pasien}</div></div>
      <div class="detail-field"><label>Layanan</label><div class="val">${t.layanan}</div></div>
      <div class="detail-field"><label>Metode</label><div class="val"><span class="badge badge-info">${t.metode}</span></div></div>
      <div class="detail-field"><label>Total</label><div class="val">${parseInt(t.total)===0?'<span class="badge badge-success">Gratis</span>':`<strong>${fmtRupiah(t.total)}</strong>`}</div></div>
      <div class="detail-field"><label>Status</label><div class="val"><span class="badge badge-success">${t.status}</span></div></div>
    </div>
  `, [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}]);
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
