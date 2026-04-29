async function renderRiwayat() {
  const body = document.getElementById('content-body');
  // Filter rekam medis berdasarkan nama pasien yang sedang login
  const params = { action: 'list' };
  // Cari pasien_id dari daftar
  if (currentRole === 'pasien' && _pasienList.length) {
    const p = _pasienList.find(x => x.nama === currentName);
    if (p) params.pasien_id = p.id;
  }
  const data = await apiGet('rekam_medis.php', params);
  body.innerHTML = `
  <div class="section-header">
    <div><h2>Riwayat Kunjungan</h2><p>Riwayat konsultasi dan pemeriksaan Anda</p></div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>No</th><th>Tanggal</th><th>Pasien</th><th>Dokter</th><th>Diagnosa</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${data.length === 0
            ? '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:20px;">Belum ada riwayat kunjungan.</td></tr>'
            : data.map((r,i)=>`<tr>
                <td>${i+1}</td>
                <td>${r.tanggal}</td>
                <td><strong>${r.nama_pasien}</strong></td>
                <td>${r.nama_dokter}</td>
                <td>${r.diagnosa}</td>
                <td><span class="badge badge-success">Selesai</span></td>
                <td>
                  <button class="btn btn-xs btn-secondary" onclick="detailRekamMedisRiwayat(${r.id})"><i class="fa-solid fa-eye"></i> Detail</button>
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function detailRekamMedisRiwayat(id) {
  try {
    const r = await apiGet('rekam_medis.php', { action: 'get', id });
    openModal('Detail Rekam Medis — ' + r.kode, `
      <div class="grid-2">
        <div class="detail-field"><label>Pasien</label><div class="val">${r.nama_pasien}</div></div>
        <div class="detail-field"><label>Dokter</label><div class="val">${r.nama_dokter}</div></div>
        <div class="detail-field"><label>Tanggal</label><div class="val">${r.tanggal}</div></div>
        <div class="detail-field"><label>Diagnosa</label><div class="val">${r.diagnosa}</div></div>
        <div class="detail-field"><label>Tekanan Darah</label><div class="val">${r.tekanan_darah||'-'}</div></div>
        <div class="detail-field"><label>Berat Badan</label><div class="val">${r.berat_badan ? r.berat_badan+' kg' : '-'}</div></div>
      </div>
      <div class="separator"></div>
      <div class="detail-field"><label>Keluhan</label><div class="val">${r.keluhan}</div></div>
      <div class="detail-field"><label>Tindakan</label><div class="val">${r.tindakan||'-'}</div></div>
    `, [{label:'Tutup', cls:'btn-secondary', action:'closeModal()'}]);
  } catch (e) { showToast(e.message, 'error'); }
}
