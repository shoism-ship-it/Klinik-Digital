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
  const isQueueOnly = currentRole === 'dokter';
  return `
  <div class="section-header">
    <div><h2>${isQueueOnly ? 'Antrian Pasien' : 'Booking Jadwal'}</h2><p>${isQueueOnly ? 'Daftar antrian pasien sesuai dokter login' : 'Buat janji temu dengan dokter klinik'}</p></div>
  </div>
  <div class="${isQueueOnly ? '' : 'booking-layout'}">
    ${isQueueOnly ? '' : `
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
    </div>`}
    <div>
      <div id="booking-output-area" style="display:none;margin-bottom:14px;"></div>
      <div class="card">
        <div class="card-header"><h3><i class="fa-solid fa-clock-rotate-left"></i> ${isQueueOnly ? 'Antrian Dokter' : 'Riwayat Booking'}</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>No Antrian</th><th>ID</th><th>Pasien</th><th>Dokter</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              ${_bookingData.length === 0
                ? '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:16px;">Belum ada booking.</td></tr>'
                : _bookingData.map(b=>`<tr>
                    <td><span class="queue-badge">${b.no_antrian || '-'}</span></td>
                    <td><span class="badge badge-muted">${b.kode}</span></td>
                    <td><strong>${b.nama_pasien}</strong></td>
                    <td>${b.nama_dokter}</td>
                    <td>${b.tanggal}</td>
                    <td><span class="badge ${bookingStatusBadge(b.status)}">${b.status}</span></td>
                    <td>
                      ${currentRole === 'admin'
                        ? `<button class="btn btn-xs btn-success" onclick="updateStatusBooking(${b.id},'Selesai')"><i class="fa-solid fa-check"></i></button>`
                        : ''}
                      ${currentRole === 'dokter'
                        ? `<button class="btn btn-xs btn-success" onclick="updateStatusBooking(${b.id},'Dikonfirmasi')"><i class="fa-solid fa-user-check"></i></button>`
                        : `<button class="btn btn-xs btn-outline" onclick="openEditBooking(${b.id})"><i class="fa-solid fa-pen"></i></button>
                           <button class="btn btn-xs btn-danger" onclick="hapusBooking(${b.id},'${b.kode}')"><i class="fa-solid fa-trash"></i></button>`}
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
            <div class="detail-field"><label>No Antrian</label><div class="val">${res.data?.no_antrian || '-'}</div></div>
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
        <td><span class="queue-badge">${b.no_antrian || '-'}</span></td>
        <td><span class="badge badge-muted">${b.kode}</span></td>
        <td><strong>${b.nama_pasien}</strong></td>
        <td>${b.nama_dokter}</td>
        <td>${b.tanggal}</td>
        <td><span class="badge ${bookingStatusBadge(b.status)}">${b.status}</span></td>
        <td>
          ${currentRole === 'admin'
            ? `<button class="btn btn-xs btn-success" onclick="updateStatusBooking(${b.id},'Selesai')"><i class="fa-solid fa-check"></i></button>`
            : ''}
          <button class="btn btn-xs btn-outline" onclick="openEditBooking(${b.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-xs btn-danger" onclick="hapusBooking(${b.id},'${b.kode}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
    }
  } catch (e) { showToast(e.message, 'error'); }
}

function openEditBooking(id) {
  const b = _bookingData.find(x => x.id === id);
  if (!b) return;

  const pasienOpts = _pasienList.map(p => `<option value="${p.id}" ${String(p.id)===String(b.pasien_id)?'selected':''}>${p.nama}</option>`).join('');
  const dokterOpts = _dokterList.map(d => `<option value="${d.id}" ${String(d.id)===String(b.dokter_id)?'selected':''}>${d.nama} (${d.spesialis})</option>`).join('');
  const statusOpts = ['Menunggu','Dikonfirmasi','Selesai','Batal'].map(s => `<option ${s===b.status?'selected':''}>${s}</option>`).join('');

  openModal('Edit Booking ' + b.kode, `
    ${currentRole !== 'pasien' ? `
    <div class="form-group">
      <label class="form-label">Pasien *</label>
      <select class="form-control" id="edit-book-pasien">${pasienOpts}</select>
    </div>` : ''}
    <div class="form-group">
      <label class="form-label">Dokter *</label>
      <select class="form-control" id="edit-book-dokter">${dokterOpts}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tanggal *</label>
        <input type="date" class="form-control" id="edit-book-tgl" value="${b.tanggal}">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="edit-book-status">${statusOpts}</select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Keluhan Awal</label>
      <textarea class="form-control" rows="3" id="edit-book-keluhan">${b.keluhan || ''}</textarea>
    </div>
  `, [
    {label:'Batal', cls:'btn-secondary', action:'closeModal()'},
    {label:'<i class="fa-solid fa-save"></i> Simpan', cls:'btn-primary', action:`saveEditBooking(${id})`}
  ]);
}

async function saveEditBooking(id) {
  const old = _bookingData.find(x => x.id === id);
  if (!old) return;

  const pasien_id = val('edit-book-pasien') || old.pasien_id;
  const dokter_id = val('edit-book-dokter');
  const tanggal = val('edit-book-tgl');
  const status = val('edit-book-status');
  const keluhan = val('edit-book-keluhan');

  if (!pasien_id || !dokter_id || !tanggal) {
    showToast('Pasien, dokter, dan tanggal wajib diisi!', 'error');
    return;
  }

  try {
    const res = await apiPost('booking.php', 'update', { id, pasien_id, dokter_id, tanggal, keluhan, status });
    closeModal();
    showToast(res.msg, 'success');
    renderSection('booking');
  } catch (e) { showToast(e.message, 'error'); }
}

async function updateStatusBooking(id, status) {
  try {
    const res = await apiPost('booking.php', 'update_status', { id, status });
    showToast(res.msg, 'success');
    renderSection('booking');
  } catch (e) { showToast(e.message, 'error'); }
}

function bookingStatusBadge(status) {
  if (status === 'Menunggu') return 'badge-warning';
  if (status === 'Dikonfirmasi') return 'badge-info';
  if (status === 'Selesai') return 'badge-success';
  return 'badge-secondary';
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
