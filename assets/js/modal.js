function openModal(title, content, buttons, large = false) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-foot').innerHTML = buttons.map(b =>
    `<button class="btn ${b.cls}" onclick="${b.action}">${b.label}</button>`
  ).join('');
  const box = document.getElementById('modal-box');
  box.className = 'modal-box' + (large ? ' modal-lg' : '');
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function closeModalBg(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function showToast(msg, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';
  t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
