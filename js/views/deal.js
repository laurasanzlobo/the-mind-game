// File: js/views/deal.js
// Author: Laura Sanz Lobo

import { state, playerLabel } from '../state.js';
import { buildPlayerUrl, buildOnlinePlayerUrl } from '../qr.js';
import { createUniqueRoomCode, pushRoomState } from '../services/sync.js';

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

  const onlineHint = state.isOnline
    ? '<p>Escaneo único: a partir de ahora las manos se actualizarán solas en cada nivel.</p>'
    : '<p>Cada jugador escanea su propio código y consulta su mano en el visor individual.</p>';

  return `
    <div class="screen screen-deal">
      <div class="topbar">
        <div class="brand"><span class="brand-mark"></span><span>The Mind</span></div>
        <button class="icon-btn" onclick="window.toggleSoundGlobal()" aria-label="Silenciar avisos sonoros" title="Sonido">${state.soundOn ? '♪' : '×'}</button>
      </div>
      <div class="level-heading">
        <h2>Nivel ${level} de ${state.maxLevels}</h2>
        ${onlineHint}
      </div>
      <div class="qr-grid${gridClass}${layoutClass}">${cards}</div>
      <button class="btn btn-primary btn-block" onclick="window.goToTable()">Ir a la mesa de juego</button>
    </div>`;
}

export async function mountQrCodes() {
  const level = state.currentLevel;

  // si es partida online y aún no hay sala, la creamos ahora (escaneo único) 
  if (state.isOnline && !state.roomCode) {
    state.roomCode = await createUniqueRoomCode();
    state.roomCreatedAt = Date.now();
    // Empuja el estado inicial para que exista el nodo antes de que escaneen el QR
    const players = {};
    for (let p = 0; p < state.numPlayers; p++) {
      players[p] = { hand: state.hands[p].slice(), playedCount: 0 };
    }
    await pushRoomState(state.roomCode, {
      createdAt: state.roomCreatedAt,
      numPlayers: state.numPlayers,
      playerNames: state.playerNames,
      maxLevels: state.maxLevels,
      currentLevel: state.currentLevel,
      lives: state.lives,
      stars: state.stars,
      status: 'playing',
      lastAction: null,
      players,
    });
  }

  for (let p = 0; p < state.numPlayers; p++) {
    const el = document.getElementById(`qr-slot-${p}`);
    if (!el) continue;
    el.innerHTML = '';

    const url = state.isOnline
      ? buildOnlinePlayerUrl(state.roomCode, p)
      : buildPlayerUrl(p, state.hands[p], level);

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