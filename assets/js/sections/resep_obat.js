let _resepData   = [];

async function renderResepObat() {
  const body = document.getElementById('content-body');
  _resepData = await apiGet('resep.php', { action: 'list' });
  body.innerHTML = _buildResepPage(_resepData);
}

function _buildResepPage(data) {
  if (currentRole !== 'pasien') {
    return `
    <div class="section-header">
      <div><h2>Data Obat Tersedia</h2><p>Daftar obat klinik sebagai referensi resep dokter</p></div>
    </div>
    ${_obatTersediaCard()}`;
  }

  return `
  <div class="section-header">
    <div><h2>Resep Obat</h2><p>Resep dari dokter dan batas waktu penggunaannya</p></div>
  </div>
  <div class="card" style="margin-bottom:16px;">
    <div class="card-header"><h3><i class="fa-solid fa-list-ul"></i> Resep Saya</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID Resep</th><th>Tanggal</th><th>Berlaku Sampai</th><th>Status</th><th>Jml Obat</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.length === 0
            ? `<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada resep.</td></tr>`
            : data.map(r=>{
              const expired = isResepExpired(r.berlaku_sampai);
              return `<tr>
                <td><span class="badge badge-muted">${r.kode}</span></td>
                <td>${r.tanggal}</td>
                <td>${r.berlaku_sampai || '-'}</td>
                <td><span class="badge ${expired ? 'badge-danger' : 'badge-success'}">${expired ? 'Kadaluarsa' : 'Berlaku'}</span></td>
                <td><span class="badge badge-info">${r.detail.length} obat</span></td>
                <td>
                  <button class="btn btn-xs btn-secondary" onclick="detailResep(${r.id})"><i class="fa-solid fa-eye"></i> Detail</button>
                </td>
              </tr>`;
            }).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ${_obatTersediaCard()}`;
}

function _obatTersediaCard() {
  return `
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

function detailResep(id) {
  const r = _resepData.find(x => x.id === id);
  if (!r) return;
  openModal('Detail Resep — ' + r.kode, `
    <div class="resep-section-title"><i class="fa-solid fa-file-prescription"></i> A. DATA RESEP</div>
    <div class="grid-2" style="margin-bottom:14px;">
      <div class="detail-field"><label>ID Resep</label><div class="val">${r.kode}</div></div>
      <div class="detail-field"><label>Tanggal</label><div class="val">${r.tanggal}</div></div>
      <div class="detail-field"><label>Berlaku Sampai</label><div class="val">${r.berlaku_sampai || '-'}</div></div>
      <div class="detail-field"><label>Status</label><div class="val"><span class="badge ${isResepExpired(r.berlaku_sampai) ? 'badge-danger' : 'badge-success'}">${isResepExpired(r.berlaku_sampai) ? 'Kadaluarsa' : 'Berlaku'}</span></div></div>
      ${currentRole !== 'pasien' ? `<div class="detail-field"><label>Pasien</label><div class="val">${r.nama_pasien}</div></div>` : ''}
      ${currentRole === 'admin' ? `<div class="detail-field"><label>Dokter</label><div class="val">${r.nama_dokter}</div></div>` : ''}
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

function isResepExpired(value) {
  if (!value) return false;
  return new Date(String(value).replace(' ', 'T')).getTime() < Date.now();
}
