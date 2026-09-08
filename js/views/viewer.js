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

function renderWelcomeScreen(title, eyebrow, onReveal) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen viewer-screen viewer-welcome">
      <span class="viewer-eyebrow">${escapeHtml(eyebrow)}</span>
      <h1 class="viewer-title">${escapeHtml(title)}</h1>
      <p class="viewer-hint">Mano lista. Pulsa el botón cuando quieras ver tus cartas en secreto.</p>
      <button class="btn btn-primary btn-block viewer-start-btn" onclick="window.revealViewerHand()">Ver mis cartas</button>
    </div>`;

  window.revealViewerHand = onReveal;
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

  const title = (info.name && info.name.trim()) ? info.name.trim() : `Jugador ${info.player}`;
  const sessionKey = `tm_seen_offline_${info.player || 1}_${info.level || 1}`;
  const isUnlocked = sessionStorage.getItem(sessionKey) === '1';

  if (!isUnlocked) {
    renderWelcomeScreen(
      title,
      info.level ? `Nivel ${info.level}` : 'The Mind',
      () => {
        sessionStorage.setItem(sessionKey, '1');
        window.location.reload();
      }
    );
    return;
  }

  const cardsHtml = info.cards.map((c, i) => `
    <div class="viewer-card" data-idx="${i}" style="animation-delay:${i * 0.05}s" onclick="window.toggleViewerCard(this)">${c}</div>
  `).join('');

  app.innerHTML = `
    <div class="screen viewer-screen">
      <span class="viewer-eyebrow">${info.level ? 'Nivel ' + info.level : 'The Mind'}</span>
      <h1 class="viewer-title">${escapeHtml(title)}</h1>
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

function handleFlashError(app, roomData) {
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

function renderOnlineViewer(roomInfo, roomData) {
  const app = document.getElementById('app');

  if (!roomData) {
    delete app.dataset.renderedLevel;
    delete app.dataset.renderedPlayer;
    app.innerHTML = `
      <div class="screen viewer-screen">
        <span class="viewer-eyebrow">The Mind</span>
        <h1 class="viewer-title">Sala no encontrada</h1>
        <p class="viewer-hint">Puede que la partida haya terminado o que el código sea incorrecto. Pide un nuevo QR desde el móvil central.</p>
      </div>`;
    return;
  }

  if (roomData.status === 'gameover' || roomData.status === 'victory') {
    delete app.dataset.renderedLevel;
    delete app.dataset.renderedPlayer;
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
    delete app.dataset.renderedLevel;
    delete app.dataset.renderedPlayer;
    app.innerHTML = `
      <div class="screen viewer-screen">
        <span class="viewer-eyebrow">The Mind</span>
        <h1 class="viewer-title">Esperando reparto…</h1>
        <p class="viewer-hint">La mesa central todavía no ha repartido las cartas de este nivel.</p>
      </div>`;
    return;
  }

  const title = (roomInfo.name && roomInfo.name.trim())
    ? roomInfo.name.trim()
    : (roomData.playerNames && roomData.playerNames[roomInfo.player]) || `Jugador ${roomInfo.player + 1}`;

  const sessionKey = `tm_seen_online_${roomInfo.room}_${roomInfo.player}`;
  const isUnlocked = sessionStorage.getItem(sessionKey) === '1';

  if (!isUnlocked) {
    delete app.dataset.renderedLevel;
    delete app.dataset.renderedPlayer;
    renderWelcomeScreen(
      title,
      roomData.currentLevel ? `Nivel ${roomData.currentLevel}` : 'The Mind',
      () => {
        sessionStorage.setItem(sessionKey, '1');
        window.location.reload();
      }
    );
    return;
  }

  const hand = playerData.hand || [];
  const playedCount = playerData.playedCount || 0;

  const currentCards = app.querySelector('.viewer-cards');
  const currentRenderedLevel = app.dataset.renderedLevel;
  const currentRenderedPlayer = app.dataset.renderedPlayer;

  // Si ya estamos mostrando este nivel para este jugador, actualizamos las clases sin destruir el DOM ni el scroll
  if (
    currentCards &&
    currentRenderedLevel === String(roomData.currentLevel) &&
    currentRenderedPlayer === String(roomInfo.player)
  ) {
    const prevScrollTop = currentCards.scrollTop;
    const cardEls = currentCards.querySelectorAll('.viewer-card');
    cardEls.forEach((el, i) => {
      if (i < playedCount) {
        el.classList.add('is-played');
      } else {
        el.classList.remove('is-played');
      }
    });

    updateViewerHighlight();

    // Mantener la posición de scroll intacta para que no salte hacia arriba
    currentCards.scrollTop = prevScrollTop;

    handleFlashError(app, roomData);
    return;
  }

  // Primer renderizado del nivel:
  app.dataset.renderedLevel = String(roomData.currentLevel);
  app.dataset.renderedPlayer = String(roomInfo.player);

  const cardsHtml = hand.map((c, i) => `
    <div class="viewer-card${i < playedCount ? ' is-played' : ''}" data-idx="${i}" style="animation-delay:${i * 0.05}s">${c}</div>
  `).join('');

  app.innerHTML = `
    <div class="screen viewer-screen">
      <span class="viewer-eyebrow">Nivel ${roomData.currentLevel}</span>
      <h1 class="viewer-title">${escapeHtml(title)}</h1>
      <div class="viewer-cards">${cardsHtml}</div>
    </div>`;

  updateViewerHighlight();
  handleFlashError(app, roomData);
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