// File: js/views/viewer.js
// Author: Laura Sanz Lobo

import { parseHash } from '../qr.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateViewerHighlight() {
  const cards = document.querySelectorAll('.viewer-card');
  let assigned = false;
  cards.forEach(card => {
    card.classList.remove('is-primary');
    if (!assigned && !card.classList.contains('is-played')) {
      card.classList.add('is-primary');
      assigned = true;
    }
  });
}

function renderViewer(info) {
  const app = document.getElementById('app');

  if (!info || !info.cards || info.cards.length === 0) {
    app.innerHTML = `
      <div class="screen viewer-screen">
        <span class="viewer-eyebrow">The Mind</span>
        <h1 class="viewer-title">Error al leer tu mano</h1>
        <p class="viewer-hint">Pide que os generen un nuevo código QR desde el móvil central y vuelve a escanearlo.</p>
      </div>`;
    return;
  }

  const cardsHtml = info.cards.map((c, i) => `
    <div class="viewer-card" data-idx="${i}" style="animation-delay:${i * 0.05}s" onclick="window.toggleViewerCard(this)">${c}</div>
  `).join('');

  const title = (info.name && info.name.trim()) ? escapeHtml(info.name.trim()) : `Jugador ${info.player}`;

  app.innerHTML = `
    <div class="screen viewer-screen">
      <span class="viewer-eyebrow">${info.level ? 'Nivel ' + info.level : 'The Mind'}</span>
      <h1 class="viewer-title">${title}</h1>
      <p class="viewer-hint">Tu mano, ordenada de menor a mayor. Toca una carta al jugarla para marcarla como descartada. Mantenla en secreto.</p>
      <div class="viewer-cards">${cardsHtml}</div>
    </div>`;

  updateViewerHighlight();
}

// Expongo esta función para el onClick de las cartas
window.toggleViewerCard = (el) => {
  el.classList.toggle('is-played');
  updateViewerHighlight();
};

function init() {
  const hashInfo = parseHash();
  renderViewer(hashInfo);
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('hashchange', () => {
  const hashInfo = parseHash();
  renderViewer(hashInfo);
});