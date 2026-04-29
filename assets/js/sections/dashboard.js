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
  body.innerHTML = `
  <div class="stats-row">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-users"></i></div><div><div class="stat-val">${stats.total_pasien??'-'}</div><div class="stat-lbl">Total Pasien</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-calendar-check"></i></div><div><div class="stat-val">${stats.total_rekam??'-'}</div><div class="stat-lbl">Kunjungan Bulan Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-pills"></i></div><div><div class="stat-val">${stats.stok_menipis??'-'}</div><div class="stat-lbl">Stok Menipis</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-calendar-xmark"></i></div><div><div class="stat-val">${stats.booking_menunggu??'-'}</div><div class="stat-lbl">Booking Menunggu</div></div></div>
  </div>
  <div class="grid-2" style="margin-bottom:16px;">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-chart-bar"></i> Kunjungan Bulanan 2024</h3></div>
      <div class="card-body">
        <div class="bar-chart">
          ${[55,70,60,85,75,90,65,80,45,70,60,95].map(v=>`<div class="bar" style="height:${v}%" data-val="${v}"></div>`).join('')}
        </div>
        <div class="bar-labels">
          ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'].map(m=>`<span>${m}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-stethoscope"></i> Distribusi Diagnosa</h3></div>
      <div class="card-body">
        ${[['ISPA / Flu','38%','var(--c1)'],['Gangguan Pencernaan','22%','var(--c2)'],['Cedera Ringan','15%','var(--c3)'],['Sakit Kepala','13%','var(--c4)'],['Lainnya','12%','var(--c5)']].map(([l,p,c])=>`
        <div class="progress-row">
          <div class="progress-meta"><span>${l}</span><strong>${p}</strong></div>
          <div class="progress-bar-bg"><div class="progress-fill" style="width:${p};background:${c};"></div></div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-receipt"></i> Total Pendapatan Bulan Ini</h3></div>
      <div class="card-body">
        <div style="font-size:28px;font-weight:700;color:var(--c1);padding:12px 0;">${fmtRupiah(stats.total_transaksi||0)}</div>
        <p style="color:var(--text-light);font-size:13px;">Total dari semua transaksi berbayar bulan ini</p>
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
  </div>`;
}

async function renderDashDokter(stats, body) {
  body.innerHTML = `
  <div class="stats-row" style="grid-template-columns:repeat(3,1fr);">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-calendar-day"></i></div><div><div class="stat-val">${stats.pasien_hari_ini??'-'}</div><div class="stat-lbl">Pasien Hari Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-file-medical"></i></div><div><div class="stat-val">${stats.total_pasien_bulan??'-'}</div><div class="stat-lbl">Rekam Medis Bulan Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-calendar-week"></i></div><div><div class="stat-val">${stats.jadwal_aktif??'-'}</div><div class="stat-lbl">Jadwal Aktif</div></div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-list-check"></i> Aksi Cepat</h3></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
          <button class="btn btn-primary" onclick="renderSection('rekam-medis')"><i class="fa-solid fa-plus"></i> Input Rekam Medis</button>
          <button class="btn btn-outline" onclick="renderSection('resep-obat')"><i class="fa-solid fa-prescription"></i> Buat Resep</button>
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
  </div>`;
}

async function renderDashPasien(stats, body) {
  body.innerHTML = `
  <div class="stats-row" style="grid-template-columns:repeat(3,1fr);">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-stethoscope"></i></div><div><div class="stat-val">${stats.total_kunjungan??'-'}</div><div class="stat-lbl">Total Kunjungan</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-prescription-bottle"></i></div><div><div class="stat-val">${stats.total_resep??'-'}</div><div class="stat-lbl">Resep Diterima</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-calendar-check"></i></div><div><div class="stat-val">${stats.booking_aktif??'-'}</div><div class="stat-lbl">Booking Aktif</div></div></div>
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
      </div>
    </div>
  </div>`;
}
