function togglePasswordVisibility(button) {
  const wrap = button.closest('.password-wrap');
  const input = wrap ? wrap.querySelector('input') : null;
  const icon = button.querySelector('i');
  if (!input) return;

  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Lihat password');
  if (icon) {
    icon.className = 'fa-solid ' + (show ? 'fa-eye-slash' : 'fa-eye');
  }
}
