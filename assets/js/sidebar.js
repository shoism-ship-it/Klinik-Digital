const menus = {
  admin: [
    { group:'Utama', items:[
      { key:'dashboard', icon:'fa-gauge', label:'Dashboard' },
      { key:'data-pasien', icon:'fa-users', label:'Data Pasien' },
      { key:'data-dokter', icon:'fa-user-doctor', label:'Data Dokter' },
      { key:'jadwal', icon:'fa-calendar-days', label:'Jadwal Praktik' },
    ]},
    { group:'Medis', items:[
      { key:'stok-obat', icon:'fa-pills', label:'Stok Obat' },
      { key:'transaksi', icon:'fa-receipt', label:'Transaksi' },
      { key:'laporan', icon:'fa-chart-pie', label:'Laporan' },
    ]},
  ],
  dokter: [
    { group:'Dokter', items:[
      { key:'dashboard', icon:'fa-gauge', label:'Dashboard' },
      { key:'jadwal', icon:'fa-calendar-days', label:'Jadwal Praktik' },
      { key:'data-pasien', icon:'fa-users', label:'Daftar Pasien' },
      { key:'rekam-medis', icon:'fa-file-medical', label:'Rekam Medis' },
      { key:'resep-obat', icon:'fa-prescription-bottle', label:'Resep Obat' },
    ]},
  ],
  pasien: [
    { group:'Pasien', items:[
      { key:'dashboard', icon:'fa-gauge', label:'Dashboard' },
      { key:'booking', icon:'fa-calendar-check', label:'Booking Jadwal' },
      { key:'riwayat', icon:'fa-clock-rotate-left', label:'Riwayat Kunjungan' },
      { key:'resep-obat', icon:'fa-prescription-bottle', label:'Resep Obat' },
    ]},
  ],
};

function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const groups = menus[currentRole];
  nav.innerHTML = groups.map(g => `
    <div class="nav-group-label">${g.group}</div>
    ${g.items.map(item => `
      <div class="nav-item ${item.key === activeMenu ? 'active' : ''}" id="nav-${item.key}" onclick="renderSection('${item.key}')">
        <i class="fa-solid ${item.icon}"></i> ${item.label}
      </div>
    `).join('')}
  `).join('');
}
