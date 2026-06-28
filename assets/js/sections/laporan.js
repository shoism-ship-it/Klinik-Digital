async function renderLaporan() {
  const body = document.getElementById('content-body');
  let stats = {};
  let laporan = { kunjungan_per_bulan: [], diagnosa: [] };
  const selectedYear = document.getElementById('laporan-year')?.value || new Date().getFullYear();
  try {
    [stats, laporan] = await Promise.all([
      apiGet('stats.php', { action: 'get' }),
      apiGet('stats.php', { action: 'laporan', year: selectedYear }),
    ]);
  } catch (_) {}
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const row = (laporan.kunjungan_per_bulan || []).find(x => parseInt(x.bulan) === i + 1);
    return row ? parseInt(row.jumlah) : 0;
  });
  const maxMonthly = Math.max(...monthly, 1);
  const incomeMonthly = Array.from({ length: 12 }, (_, i) => {
    const row = (laporan.pendapatan_per_bulan || []).find(x => parseInt(x.bulan) === i + 1);
    return row ? parseInt(row.total) : 0;
  });
  const maxIncome = Math.max(...incomeMonthly, 1);
  const totalDiagnosa = (laporan.diagnosa || []).reduce((s, x) => s + (parseInt(x.jumlah) || 0), 0) || 1;
  body.innerHTML = `
  <div class="section-header">
    <div><h2>Laporan</h2><p>Statistik dan laporan kunjungan klinik</p></div>
    <div class="section-header-actions">
      <select class="form-control" id="laporan-year" style="width:auto;padding:8px 12px;" onchange="renderLaporan()">
        ${[new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()-2, 2024, 2023].filter((v,i,a)=>a.indexOf(v)===i).map(y=>`<option value="${y}" ${String(y)===String(selectedYear)?'selected':''}>Tahun ${y}</option>`).join('')}
      </select>
      <button class="btn btn-secondary" onclick="exportLaporanCsv()"><i class="fa-solid fa-file-export"></i> Export</button>
    </div>
  </div>
  <div class="stats-row">
    <div class="stat-card"><div class="stat-icon teal"><i class="fa-solid fa-users"></i></div><div><div class="stat-val">${stats.total_pasien??'-'}</div><div class="stat-lbl">Total Pasien</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-stethoscope"></i></div><div><div class="stat-val">${stats.total_rekam??'-'}</div><div class="stat-lbl">Kunjungan Bulan Ini</div></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-user-doctor"></i></div><div><div class="stat-val">${stats.total_dokter??'-'}</div><div class="stat-lbl">Dokter Aktif</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-money-bill"></i></div><div><div class="stat-val">${fmtRupiah(laporan.total_pendapatan||0)}</div><div class="stat-lbl">Pendapatan ${selectedYear}</div></div></div>
  </div>
  <div class="grid-2" style="margin-top:16px;">
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-chart-bar"></i> Kunjungan Per Bulan</h3></div>
      <div class="card-body">
        <div class="bar-chart">
          ${monthly.map(v=>`<div class="bar" style="height:${Math.max(8, Math.round((v / maxMonthly) * 100))}%" data-val="${v}"></div>`).join('')}
        </div>
        <div class="bar-labels">
          ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'].map(m=>`<span>${m}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-stethoscope"></i> Distribusi Diagnosa</h3></div>
      <div class="card-body">
        ${(laporan.diagnosa || []).length === 0
          ? '<p style="color:var(--text-light);font-size:13px;">Belum ada data diagnosa untuk tahun ini.</p>'
          : (laporan.diagnosa || []).map((row, idx)=>{
            const pct = Math.round(((parseInt(row.jumlah)||0) / totalDiagnosa) * 100) + '%';
            const colors = ['var(--c1)','var(--c2)','var(--c3)','var(--success)','var(--warning)'];
            return `
        <div class="progress-row">
          <div class="progress-meta"><span>${row.diagnosa}</span><strong>${pct}</strong></div>
          <div class="progress-bar-bg"><div class="progress-fill" style="width:${pct};background:${colors[idx] || 'var(--c4)'};"></div></div>
        </div>`;
          }).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3><i class="fa-solid fa-money-bill-trend-up"></i> Total Pendapatan Per Bulan</h3></div>
      <div class="card-body">
        <div class="bar-chart">
          ${incomeMonthly.map(v=>`<div class="bar" style="height:${Math.max(8, Math.round((v / maxIncome) * 100))}%" data-val="${fmtRupiah(v)}"></div>`).join('')}
        </div>
        <div class="bar-labels">
          ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'].map(m=>`<span>${m}</span>`).join('')}
        </div>
        <div style="margin-top:14px;font-size:22px;font-weight:700;color:var(--c1);">${fmtRupiah(laporan.total_pendapatan || 0)}</div>
      </div>
    </div>
  </div>`;
}

async function exportLaporanCsv() {
  const year = document.getElementById('laporan-year')?.value || new Date().getFullYear();
  try {
    const laporan = await apiGet('stats.php', { action: 'laporan', year });
    const rows = [
      ['Jenis', 'Periode', 'Jumlah'],
      ...(laporan.kunjungan_per_bulan || []).map(r => ['Kunjungan', `Bulan ${r.bulan}`, r.jumlah]),
      ...(laporan.diagnosa || []).map(r => ['Diagnosa', r.diagnosa, r.jumlah]),
      ...(laporan.pendapatan_per_bulan || []).map(r => ['Pendapatan', `Bulan ${r.bulan}`, r.total]),
      ['Total Pendapatan', String(year), laporan.total_pendapatan || 0],
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-klinik-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Laporan berhasil diexport', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}
