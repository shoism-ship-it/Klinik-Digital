let activeMenu = 'dashboard';

const sectionTitles = {
  'dashboard':    ['Dashboard', 'Ringkasan aktivitas sistem klinik'],
  'data-pasien':  ['Data Pasien', 'Kelola data seluruh pasien terdaftar'],
  'data-dokter':  ['Data Dokter', 'Kelola data dokter dan tenaga medis'],
  'jadwal':       ['Jadwal Praktik', 'Jadwal praktik dokter dan ruangan'],
  'stok-obat':    ['Stok Obat', 'Monitoring dan kelola persediaan obat'],
  'transaksi':    ['Transaksi', 'Riwayat transaksi layanan klinik'],
  'laporan':      ['Laporan', 'Statistik dan laporan kunjungan'],
  'rekam-medis':  ['Rekam Medis', 'Input dan kelola rekam medis pasien'],
  'resep-obat':   ['Resep Obat', 'Manajemen resep dan pengeluaran obat'],
  'booking':      ['Booking Jadwal', 'Buat janji dengan dokter'],
  'riwayat':      ['Riwayat Kunjungan', 'Riwayat konsultasi dan pemeriksaan Anda'],
};

const sectionRenderers = {
  'dashboard':   renderDashboard,
  'data-pasien': renderDataPasien,
  'data-dokter': renderDataDokter,
  'jadwal':      renderJadwal,
  'stok-obat':   renderStokObat,
  'transaksi':   renderTransaksi,
  'laporan':     renderLaporan,
  'rekam-medis': renderRekamMedis,
  'resep-obat':  renderResepObat,
  'booking':     renderBooking,
  'riwayat':     renderRiwayat,
};

async function renderSection(key) {
  activeMenu = key;
  buildSidebar();
  const [title, sub] = sectionTitles[key] || ['', ''];
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-sub').textContent = sub;
  const body = document.getElementById('content-body');
  showLoading(body);
  try {
    const renderer = sectionRenderers[key];
    if (renderer) {
      await renderer();
    } else {
      body.innerHTML = '<p style="padding:20px">Halaman tidak ditemukan.</p>';
    }
  } catch (e) {
    body.innerHTML = `<div style="padding:20px;color:var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat: ${e.message}</div>`;
  }
}
