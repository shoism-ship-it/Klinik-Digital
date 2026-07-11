async function renderDashboard() {
  const body = document.getElementById('content-body');
  let stats = {};
  try {
    stats = await apiGet('stats.php', { action: 'get' });
  } catch (_) {}

  if (currentRole === 'admin')  return renderDashAdmin(stats, body);
  if (currentRole === 'dokter') return renderDashDokter(stats, body);
  return renderDashPasien(stats, body);
}

async function renderDashAdmin(stats, body) {
  const waiting = stats.booking_menunggu_list || [];
  const critical = stats.stok_kritis_list || [];
  body.innerHTML = `
  <div class="section-header">
    <div><h2>Dashboard</h2><p>Ringkasan aktivitas sistem klinik</p></div>
  </div>
  <div class="role-dashboard role-dashboard-admin">
  <div class="stats-row">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-users"></i></div><div><div class="stat-val">${stats.total_pasien??'-'}</div><div class="stat-lbl">Total Pasien</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-calendar-check"></i></div><div><div class="stat-val">${stats.total_rekam??'-'}</div><div class="stat-lbl">Kunjungan Bulan Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-pills"></i></div><div><div class="stat-val">${stats.stok_menipis??'-'}</div><div class="stat-lbl">Stok Menipis</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-calendar-xmark"></i></div><div><div class="stat-val">${stats.booking_menunggu??'-'}</div><div class="stat-lbl">Booking Menunggu</div></div></div>
  </div>
  <div class="grid-2" style="margin-bottom:16px;">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-calendar-check"></i> Booking Menunggu</h3><span class="badge badge-warning">${waiting.length} data</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Antrian</th><th>ID</th><th>Pasien</th><th>Dokter</th><th>Tanggal</th></tr></thead>
          <tbody>
            ${waiting.length === 0
              ? '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:16px;">Tidak ada booking menunggu.</td></tr>'
              : waiting.map(b => `<tr>
                <td><span class="queue-badge">${b.no_antrian || '-'}</span></td>
                <td><span class="badge badge-muted">${b.kode}</span></td>
                <td><strong>${esc(b.nama_pasien)}</strong></td>
                <td>${esc(b.nama_dokter)}</td>
                <td>${b.tanggal}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-pills"></i> Status Stok Kritis</h3><span class="badge ${critical.length ? 'badge-danger' : 'badge-success'}">${critical.length} obat</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Obat</th><th>Kategori</th><th>Stok</th><th>Kadaluarsa</th></tr></thead>
          <tbody>
            ${critical.length === 0
              ? '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:16px;">Semua stok masih aman.</td></tr>'
              : critical.map(o => `<tr>
                <td><span class="badge badge-muted">${o.kode}</span></td>
                <td><strong>${esc(o.nama)}</strong></td>
                <td>${esc(o.kategori || '-')}</td>
                <td style="color:var(--danger);font-weight:700;">${o.stok} ${esc(o.satuan || '')}</td>
                <td>${o.kadaluarsa || '-'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-receipt"></i> Transaksi Menunggu</h3></div>
      <div class="card-body">
        <div style="font-size:28px;font-weight:700;color:var(--warning);padding:12px 0;">${stats.transaksi_menunggu??0}</div>
        <p style="color:var(--text-light);font-size:13px;">Pembayaran pasien yang masih perlu dikonfirmasi</p>
        <button class="btn btn-outline btn-sm" onclick="renderSection('transaksi')">Lihat Transaksi</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-user-doctor"></i> Dokter Terdaftar</h3></div>
      <div class="card-body">
        <div style="font-size:28px;font-weight:700;color:var(--c2);padding:12px 0;">${stats.total_dokter??'-'}</div>
        <p style="color:var(--text-light);font-size:13px;">Tenaga medis aktif di klinik</p>
        <button class="btn btn-outline btn-sm" onclick="renderSection('data-dokter')">Lihat Data Dokter</button>
      </div>
    </div>
  </div>
  </div>`;
}

async function renderDashDokter(stats, body) {
  body.innerHTML = `
  <div class="section-header">
    <div><h2>Dashboard</h2><p>Ringkasan aktivitas dokter hari ini</p></div>
  </div>
  <div class="role-dashboard role-dashboard-dokter">
  <div class="stats-row" style="grid-template-columns:repeat(4,1fr);">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-calendar-day"></i></div><div><div class="stat-val">${stats.pasien_hari_ini??'-'}</div><div class="stat-lbl">Pasien Hari Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-file-medical"></i></div><div><div class="stat-val">${stats.total_pasien_bulan??'-'}</div><div class="stat-lbl">Rekam Medis Bulan Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-calendar-week"></i></div><div><div class="stat-val">${stats.jadwal_aktif??'-'}</div><div class="stat-lbl">Jadwal Aktif</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-list-ol"></i></div><div><div class="stat-val">${stats.antrian_hari_ini??'-'}</div><div class="stat-lbl">Antrian Hari Ini</div></div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-list-check"></i> Aksi Cepat</h3></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
          <button class="btn btn-primary" onclick="renderSection('rekam-medis')"><i class="fa-solid fa-plus"></i> Input Rekam Medis</button>
          <button class="btn btn-outline" onclick="renderSection('resep-obat')"><i class="fa-solid fa-capsules"></i> Lihat Obat</button>
          <button class="btn btn-outline" onclick="renderSection('booking')"><i class="fa-solid fa-list-ol"></i> Lihat Antrian</button>
          <button class="btn btn-outline" onclick="renderSection('jadwal')"><i class="fa-solid fa-calendar"></i> Lihat Jadwal</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-circle-info"></i> Info Dokter</h3></div>
      <div class="card-body">
        <div class="detail-field"><label>Nama</label><div class="val">${currentName}</div></div>
        <div class="detail-field"><label>Role</label><div class="val"><span class="badge badge-info">Dokter</span></div></div>
      </div>
    </div>
  </div>
  </div>`;
}

async function renderDashPasien(stats, body) {
  body.innerHTML = `
  <div class="section-header">
    <div><h2>Dashboard</h2><p>Ringkasan layanan dan aktivitas pasien</p></div>
  </div>
  <div class="role-dashboard role-dashboard-pasien">
  <div class="stats-row" style="grid-template-columns:repeat(4,1fr);">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-stethoscope"></i></div><div><div class="stat-val">${stats.total_kunjungan??'-'}</div><div class="stat-lbl">Total Kunjungan</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-prescription-bottle"></i></div><div><div class="stat-val">${stats.total_resep??'-'}</div><div class="stat-lbl">Resep Diterima</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-calendar-check"></i></div><div><div class="stat-val">${stats.booking_aktif??'-'}</div><div class="stat-lbl">Booking Aktif</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-qrcode"></i></div><div><div class="stat-val">${stats.transaksi_menunggu??'-'}</div><div class="stat-lbl">Transaksi Menunggu</div></div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-id-card-clip"></i> Data Saya</h3></div>
      <div class="card-body">
        <div class="grid-2">
          <div class="detail-field"><label>Nama</label><div class="val">${currentName}</div></div>
          <div class="detail-field"><label>Role</label><div class="val"><span class="badge badge-info">Pasien</span></div></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-calendar-plus"></i> Booking Baru</h3></div>
      <div class="card-body" style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-primary" onclick="renderSection('booking')"><i class="fa-solid fa-calendar-plus"></i> Buat Booking</button>
        <button class="btn btn-outline" onclick="renderSection('riwayat')"><i class="fa-solid fa-clock-rotate-left"></i> Riwayat Saya</button>
        <button class="btn btn-outline" onclick="renderSection('transaksi')"><i class="fa-solid fa-qrcode"></i> Transaksi Saya</button>
      </div>
    </div>
  </div>
  </div>`;
}
