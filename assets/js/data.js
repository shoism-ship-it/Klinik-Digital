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

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function kode(prefix, id) {
  return prefix + String(id).padStart(3, '0');
}
