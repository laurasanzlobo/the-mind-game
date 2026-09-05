// File: js/views/viewer.js
// Author: Laura Sanz Lobo

import { parseHash, parseRoomParams } from '../qr.js';
import { subscribeRoom } from '../services/sync.js';

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

// ==========================================
// MODO OFFLINE (fallback manual, comportamiento original)
// ==========================================
function renderOfflineViewer(info) {
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

window.toggleViewerCard = (el) => {
  el.classList.toggle('is-played');
  updateViewerHighlight();
};

// ==========================================
// MODO ONLINE (sincronizado con Firebase)
// ==========================================
let lastRenderedActionTs = null;

function renderOnlineViewer(roomInfo, roomData) {
  const app = document.getElementById('app');

  if (!roomData) {
    app.innerHTML = `
      <div class="screen viewer-screen">
        <span class="viewer-eyebrow">The Mind</span>
        <h1 class="viewer-title">Sala no encontrada</h1>
        <p class="viewer-hint">Puede que la partida haya terminado o que el código sea incorrecto. Pide un nuevo QR desde el móvil central.</p>
      </div>`;
    return;
  }

  if (roomData.status === 'gameover' || roomData.status === 'victory') {
    const isVictory = roomData.status === 'victory';
    app.innerHTML = `
      <div class="screen viewer-screen">
        <span class="viewer-eyebrow">The Mind</span>
        <h1 class="viewer-title">${isVictory ? '¡Sincronía perfecta!' : 'Sin vidas :('}</h1>
        <p class="viewer-hint">${isVictory ? 'Habéis completado todos los niveles.' : `Habéis llegado hasta el nivel ${roomData.currentLevel}.`} Consulta la mesa central para más detalles.</p>
      </div>`;
    return;
  }

  const playerData = roomData.players ? roomData.players[roomInfo.player] : null;
  if (!playerData) {
    app.innerHTML = `
      <div class="screen viewer-screen">
        <span class="viewer-eyebrow">The Mind</span>
        <h1 class="viewer-title">Esperando reparto…</h1>
        <p class="viewer-hint">La mesa central todavía no ha repartido las cartas de este nivel.</p>
      </div>`;
    return;
  }

  const hand = playerData.hand || [];
  const playedCount = playerData.playedCount || 0;

  const cardsHtml = hand.map((c, i) => `
    <div class="viewer-card${i < playedCount ? ' is-played' : ''}" data-idx="${i}" style="animation-delay:${i * 0.05}s">${c}</div>
  `).join('');

  const title = (roomInfo.name && roomInfo.name.trim())
    ? escapeHtml(roomInfo.name.trim())
    : (roomData.playerNames && roomData.playerNames[roomInfo.player]) || `Jugador ${roomInfo.player + 1}`;

  app.innerHTML = `
    <div class="screen viewer-screen">
      <span class="viewer-eyebrow">Nivel ${roomData.currentLevel}</span>
      <h1 class="viewer-title">${escapeHtml(title)}</h1>
      <p class="viewer-hint">Tu mano, ordenada de menor a mayor. Se actualiza sola cuando juegues en la mesa. Mantenla en secreto.</p>
      <div class="viewer-cards">${cardsHtml}</div>
    </div>`;

  updateViewerHighlight();

  // --- Flash visual de error (solo si es una acción nueva) ---
  const la = roomData.lastAction;
  if (la && la.type === 'error' && la.ts !== lastRenderedActionTs) {
    lastRenderedActionTs = la.ts;
    const screenEl = app.querySelector('.viewer-screen');
    if (screenEl) {
      screenEl.classList.add('flash-error');
      setTimeout(() => screenEl.classList.remove('flash-error'), 650);
    }
  } else if (la) {
    lastRenderedActionTs = la.ts;
  }
}

function initOnline(roomInfo) {
  subscribeRoom(roomInfo.room, (roomData) => {
    renderOnlineViewer(roomInfo, roomData);
  });
}

function init() {
  const roomInfo = parseRoomParams();
  if (roomInfo) {
    initOnline(roomInfo);
  } else {
    const hashInfo = parseHash();
    renderOfflineViewer(hashInfo);
    window.addEventListener('hashchange', () => {
      renderOfflineViewer(parseHash());
    });
  }
}

window.addEventListener('DOMContentLoaded', init);