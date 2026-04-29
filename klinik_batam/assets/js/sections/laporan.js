async function renderLaporan() {
  const body = document.getElementById('content-body');
  let stats = {};
  try {
    stats = await apiGet('stats.php', { action: 'get' });
  } catch (_) {}
  body.innerHTML = `
  <div class="section-header">
    <div><h2>Laporan</h2><p>Statistik dan laporan kunjungan klinik</p></div>
    <div class="section-header-actions">
      <select class="form-control" style="width:auto;padding:8px 12px;"><option>Tahun 2024</option><option>Tahun 2023</option></select>
      <button class="btn btn-secondary"><i class="fa-solid fa-file-export"></i> Export</button>
    </div>
  </div>
  <div class="stats-row">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-users"></i></div><div><div class="stat-val">${stats.total_pasien??'-'}</div><div class="stat-lbl">Total Pasien</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-stethoscope"></i></div><div><div class="stat-val">${stats.total_rekam??'-'}</div><div class="stat-lbl">Kunjungan Bulan Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-user-doctor"></i></div><div><div class="stat-val">${stats.total_dokter??'-'}</div><div class="stat-lbl">Dokter Aktif</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-money-bill"></i></div><div><div class="stat-val">${fmtRupiah(stats.total_transaksi||0)}</div><div class="stat-lbl">Pendapatan Bulan Ini</div></div></div>
  </div>
  <div class="grid-2" style="margin-top:16px;">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-chart-bar"></i> Kunjungan Per Bulan</h3></div>
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
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-pills"></i> Status Stok Kritis</h3></div>
      <div class="card-body">
        <div style="font-size:32px;font-weight:700;color:${(stats.stok_menipis||0)>0?'var(--danger)':'var(--success)'};padding:12px 0;">${stats.stok_menipis??0}</div>
        <p style="color:var(--text-light);font-size:13px;">Jenis obat dengan stok di bawah 20 unit</p>
        <button class="btn btn-outline btn-sm" onclick="renderSection('stok-obat')"><i class="fa-solid fa-arrow-right"></i> Kelola Stok</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-calendar-check"></i> Booking Menunggu</h3></div>
      <div class="card-body">
        <div style="font-size:32px;font-weight:700;color:var(--warning);padding:12px 0;">${stats.booking_menunggu??0}</div>
        <p style="color:var(--text-light);font-size:13px;">Booking pasien yang menunggu konfirmasi</p>
        <button class="btn btn-outline btn-sm" onclick="renderSection('booking')"><i class="fa-solid fa-arrow-right"></i> Kelola Booking</button>
      </div>
    </div>
  </div>`;
}
