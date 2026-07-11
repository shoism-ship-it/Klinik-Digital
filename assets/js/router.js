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
  'resep-obat':   ['Resep Obat', 'Riwayat resep pasien dan data obat tersedia'],
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
  const topbarTitle = document.getElementById('topbar-title');
  const topbarSub = document.getElementById('topbar-sub');
  if (topbarTitle) topbarTitle.textContent = title;
  if (topbarSub) topbarSub.textContent = sub;
  const body = document.getElementById('content-body');
  showLoading(body);
  try {
    const renderer = sectionRenderers[key];
    if (renderer) {
      await renderer();
      enhanceResponsiveTables(body);
    } else {
      body.innerHTML = '<p style="padding:20px">Halaman tidak ditemukan.</p>';
    }
  } catch (e) {
    body.innerHTML = `<div style="padding:20px;color:var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat: ${e.message}</div>`;
  }
}

function enhanceResponsiveTables(root = document) {
  root.querySelectorAll('table').forEach(table => {
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    if (!headers.length) return;

    table.classList.add('responsive-card-table');
    table.querySelectorAll('tbody tr').forEach(row => {
      const cells = Array.from(row.children).filter(cell => cell.tagName.toLowerCase() === 'td');
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) {
        cells[0].classList.add('table-empty-cell');
        return;
      }

      cells.forEach((cell, index) => {
        const label = headers[index] || '';
        cell.dataset.label = label;
        if (label.toLowerCase() === 'aksi') {
          cell.classList.add('td-actions');
        }
      });
    });
  });
}

function initResponsiveEnhancements() {
  const targets = ['content-body', 'modal-content']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  targets.forEach(target => {
    const observer = new MutationObserver(() => enhanceResponsiveTables(target));
    observer.observe(target, { childList: true, subtree: true });
  });
}

document.addEventListener('DOMContentLoaded', initResponsiveEnhancements);
