// File: js/views/deal.js
// Author: Laura Sanz Lobo

import { state, playerLabel } from '../state.js';
import { buildPlayerUrl } from '../qr.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderDeal(renderCallback) {
  const level = state.currentLevel;
  let cards = '';
  
  for (let p = 0; p < state.numPlayers; p++) {
    const hand = state.hands[p];
    cards += `
      <div class="qr-card">
        <span class="qr-card-badge">${escapeHtml(playerLabel(p))}</span>
        <div class="qr-box" id="qr-slot-${p}"></div>
        <span class="qr-card-count">${hand.length} carta${hand.length === 1 ? '' : 's'}</span>
      </div>`;
  }

  const gridClass = (state.numPlayers === 4) ? ' qr-grid-4' : (state.numPlayers === 3) ? ' qr-grid-3' : '';
  const layoutClass = state.layoutMode === 'tablet'
    ? ' layout-tablet'
    : (state.layoutMode === 'mobile' ? ' layout-mobile-deal' : '');

  window.goToTable = () => {
    state.screen = 'table';
    if (renderCallback) renderCallback();
  };

  return `
    <div class="screen screen-deal">
      <div class="topbar">
        <div class="brand"><span class="brand-mark"></span><span>The Mind</span></div>
        <button class="icon-btn" onclick="window.toggleSoundGlobal()" aria-label="Silenciar avisos sonoros" title="Sonido">${state.soundOn ? '♪' : '×'}</button>
      </div>
      <div class="level-heading">
        <h2>Nivel ${level} de ${state.maxLevels}</h2>
        <p>Cada jugador escanea su propio código y consulta su mano en el visor individual.</p>
      </div>
      <div class="qr-grid${gridClass}${layoutClass}">${cards}</div>
      <button class="btn btn-primary btn-block" onclick="window.goToTable()">Ir a la mesa de juego</button>
    </div>`;
}

export function mountQrCodes() {
  const level = state.currentLevel;
  for (let p = 0; p < state.numPlayers; p++) {
    const el = document.getElementById(`qr-slot-${p}`);
    if (!el) continue;
    el.innerHTML = '';
    const url = buildPlayerUrl(p, state.hands[p], level);
    /* eslint-disable no-new */
    new QRCode(el, {
      text: url,
      width: 150,
      height: 150,
      colorDark: '#0a0a13',
      colorLight: '#f2f0fa',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }
}