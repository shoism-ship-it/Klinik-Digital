async function apiGet(endpoint, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = 'api/' + endpoint + (qs ? '?' + qs : '');
  const res = await fetch(url, { credentials: 'same-origin' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.msg || 'Gagal mengambil data');
  return json.data;
}

async function apiPost(endpoint, action, payload = {}) {
  const url = 'api/' + endpoint + '?action=' + action;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.msg || 'Operasi gagal');
  return json;
}

function showLoading(container) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (el) el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-light)"><i class="fa-solid fa-spinner fa-spin fa-xl"></i><p style="margin-top:10px">Memuat data...</p></div>';
}
