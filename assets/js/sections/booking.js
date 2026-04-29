let _bookingData = [];

async function renderBooking() {
  const body = document.getElementById('content-body');
  _bookingData = await apiGet('booking.php', { action: 'list' });
  body.innerHTML = _buildBookingPage();
}

function _buildBookingPage() {
  const today       = new Date().toISOString().split('T')[0];
  const pasienOpts  = _pasienList.map(p => `<option value="${p.id}">${p.nama}</option>`).join('');
  const dokterOpts  = _dokterList.map(d => `<option value="${d.id}">${d.nama} (${d.spesialis})</option>`).join('');
  return `
  <div class="section-header">
    <div><h2>Booking Jadwal</h2><p>Buat janji temu dengan dokter klinik</p></div>
  </div>
  <div class="booking-layout">
    <div>
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-calendar-plus"></i> Form Booking</h3></div>
        <div class="card-body">
          ${currentRole !== 'pasien' ? `
          <div class="form-group"><label class="form-label">Pasien *</label>
            <select class="form-control" id="book-pasien">${pasienOpts}</select>
          </div>` : ''}
          <div class="form-group"><label class="form-label">Pilih Dokter *</label>
            <select class="form-control" id="book-dokter">${dokterOpts}</select>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Tanggal *</label>
              <input type="date" class="form-control" id="book-tgl" value="${today}" min="${today}">
            </div>
            <div class="form-group"><label class="form-label">Jam</label>
              <select class="form-control" id="book-jam">
                <option>08:00</option><option>09:00</option><option>10:00</option>
                <option>11:00</option><option>13:00</option><option>14:00</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Keluhan Awal</label>
            <textarea class="form-control" rows="3" id="book-keluhan" placeholder="Tuliskan keluhan Anda..."></textarea>
          </div>
          <button class="btn btn-primary btn-w-full" onclick="doBooking()">
            <i class="fa-solid fa-calendar-check"></i> Booking Sekarang
          </button>
        </div>
      </div>
    </div>
    <div>
      <div id="booking-output-area" style="display:none;margin-bottom:14px;"></div>
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-clock-rotate-left"></i> Riwayat Booking</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Pasien</th><th>Dokter</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${_bookingData.length === 0
                ? '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:16px;">Belum ada booking.</td></tr>'
                : _bookingData.map(b=>`<tr>
                    <td><span class="badge badge-muted">${b.kode}</span></td>
                    <td><strong>${b.nama_pasien}</strong></td>
                    <td>${b.nama_dokter}</td>
                    <td>${b.tanggal}</td>
                    <td><span class="badge ${b.status==='Menunggu'?'badge-warning':b.status==='Selesai'?'badge-success':'badge-secondary'}">${b.status}</span></td>
                    <td>
                      ${currentRole === 'admin'
                        ? `<button class="btn btn-xs btn-success" onclick="updateStatusBooking(${b.id},'Selesai')"><i class="fa-solid fa-check"></i></button>`
                        : ''}
                      <button class="btn btn-xs btn-danger" onclick="hapusBooking(${b.id},'${b.kode}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

async function doBooking() {
  const dokter_id = val('book-dokter');
  const tanggal   = val('book-tgl');
  const keluhan   = val('book-keluhan');

  if (!dokter_id || !tanggal) { showToast('Dokter dan tanggal wajib diisi!', 'error'); return; }

  // Resolve pasien_id
  let pasien_id = val('book-pasien');
  if (!pasien_id && currentRole === 'pasien') {
    // Cari pasien dari daftar berdasarkan nama
    const p = _pasienList.find(x => x.nama === currentName);
    pasien_id = p ? p.id : '';
  }
  if (!pasien_id) { showToast('Pasien tidak ditemukan!', 'error'); return; }

  try {
    const res = await apiPost('booking.php', 'create', { pasien_id, dokter_id, tanggal, keluhan });
    const dokter   = _dokterList.find(d => d.id == dokter_id);
    const outArea  = document.getElementById('booking-output-area');
    if (outArea) {
      outArea.style.display = 'block';
      outArea.innerHTML = `
        <div class="booking-result">
          <h4><i class="fa-solid fa-circle-check" style="color:var(--success);"></i> Konfirmasi Booking</h4>
          <div class="grid-2">
            <div class="detail-field"><label>Dokter</label><div class="val">${dokter?.nama||'-'}</div></div>
            <div class="detail-field"><label>Tanggal</label><div class="val">${tanggal}</div></div>
            <div class="detail-field"><label>Jam</label><div class="val">${val('book-jam')}</div></div>
            <div class="detail-field"><label>Keluhan</label><div class="val">${keluhan||'(tidak ada)'}</div></div>
          </div>
          <div style="margin-top:10px;"><span class="badge badge-warning"><i class="fa-solid fa-hourglass-half"></i> Menunggu Konfirmasi</span></div>
        </div>`;
    }
    showToast(res.msg, 'success');
    // Refresh riwayat booking
    _bookingData = await apiGet('booking.php', { action: 'list' });
    const tbody = document.querySelector('.booking-layout .card:last-child tbody');
    if (tbody) {
      tbody.innerHTML = _bookingData.map(b=>`<tr>
        <td><span class="badge badge-muted">${b.kode}</span></td>
        <td><strong>${b.nama_pasien}</strong></td>
        <td>${b.nama_dokter}</td>
        <td>${b.tanggal}</td>
        <td><span class="badge ${b.status==='Menunggu'?'badge-warning':b.status==='Selesai'?'badge-success':'badge-secondary'}">${b.status}</span></td>
        <td>
          ${currentRole === 'admin'
            ? `<button class="btn btn-xs btn-success" onclick="updateStatusBooking(${b.id},'Selesai')"><i class="fa-solid fa-check"></i></button>`
            : ''}
          <button class="btn btn-xs btn-danger" onclick="hapusBooking(${b.id},'${b.kode}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
    }
  } catch (e) { showToast(e.message, 'error'); }
}

async function updateStatusBooking(id, status) {
  try {
    const res = await apiPost('booking.php', 'update_status', { id, status });
    showToast(res.msg, 'success');
    renderSection('booking');
  } catch (e) { showToast(e.message, 'error'); }
}

function hapusBooking(id, kode) {
  openModal('Hapus Booking', `<p style="text-align:center;padding:12px 0;">Yakin hapus booking <strong>${kode}</strong>?</p>`, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-trash"></i> Hapus', cls:'btn-danger', action:`_konfirmasiHapusBooking(${id})`}
  ]);
}

async function _konfirmasiHapusBooking(id) {
  try {
    const res = await apiPost('booking.php', 'delete', { id });
    closeModal();
    showToast(res.msg, 'info');
    renderSection('booking');
  } catch (e) { showToast(e.message, 'error'); }
}
