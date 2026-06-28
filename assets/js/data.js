// Reference lists — preloaded at startup by auth.js initApp()
let _pasienList = [];   // [{id, kode, nama}]
let _dokterList = [];   // [{id, kode, nama, spesialis, hari, jam}]
let _obatList   = [];   // [{id, kode, nama, satuan, stok}]

function genId(prefix, arr, field = 'id') {
  const nums = arr.map(x => { const m = String(x[field]).match(/\d+$/); return m ? parseInt(m[0]) : 0; });
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return prefix + String(next).padStart(3, '0');
}

function fmtTgl(val) {
  if (!val) return '-';
  const parts = val.split('-');
  if (parts.length !== 3) return val;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function fmtRupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[ch]));
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function kode(prefix, id) {
  return prefix + String(id).padStart(3, '0');
}

function currentDokter() {
  return _dokterList.find(d => d.nama === currentName) || null;
}

function currentPasien() {
  return _pasienList.find(p => p.nama === currentName) || null;
}

function prodiOptions() {
  return ['Teknik Informatika', 'Teknik Elektro', 'Teknik Mesin', 'Manajemen dan Bisnis'];
}
