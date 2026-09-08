// File: js/views/modal.js
// Author: Laura Sanz Lobo

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let activeModalEl = null;

export function showConfirmModal({
  badgeHtml,
  badgeClass = '',
  title,
  description,
  confirmText,
  cancelText = 'Cancelar',
  confirmBtnClass = 'btn-primary',
  onConfirm,
  onCancel,
}) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-badge ${badgeClass}">${badgeHtml}</div>
      <h2 class="modal-title">${escapeHtml(title)}</h2>
      <p class="modal-desc">${escapeHtml(description)}</p>
      <div class="modal-actions">
        <button class="btn ${confirmBtnClass} btn-block modal-btn-confirm">${escapeHtml(confirmText)}</button>
        <button class="btn btn-ghost btn-block modal-btn-cancel">${escapeHtml(cancelText)}</button>
      </div>
    </div>
  `;

  const handleClose = () => {
    closeModal();
    if (onCancel) onCancel();
  };

  const handleConfirm = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  overlay.querySelector('.modal-btn-confirm').addEventListener('click', (e) => {
    e.stopPropagation();
    handleConfirm();
  });

  overlay.querySelector('.modal-btn-cancel').addEventListener('click', (e) => {
    e.stopPropagation();
    handleClose();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      handleClose();
    }
  });

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };
  window.addEventListener('keydown', onKeyDown);
  overlay._cleanupKeyDown = () => window.removeEventListener('keydown', onKeyDown);

  document.body.appendChild(overlay);
  activeModalEl = overlay;
}

export function closeModal() {
  if (activeModalEl) {
    if (activeModalEl._cleanupKeyDown) activeModalEl._cleanupKeyDown();
    activeModalEl.remove();
    activeModalEl = null;
  }
}

