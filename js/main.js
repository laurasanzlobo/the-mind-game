// File: js/main.js
// Author: Laura Sanz Lobo

import { state, resetState } from './state.js';
import { CONFIG, REWARDS, MAX_LIVES, MAX_STARS } from './config.js';
import { soundOk, soundError, soundNinja, soundLevelUp, soundVictory, soundDefeat, toggleSound } from './audio.js';
import { renderSetup } from './views/step-players.js';
import { renderDeal, mountQrCodes } from './views/deal.js';
import { renderTable, renderGameOver, renderVictory } from './views/table.js';
import { pushRoomState, deleteRoom } from './services/sync.js';
import { showConfirmModal } from './views/modal.js';

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRoomSnapshot(status) {
  const players = {};
  for (let p = 0; p < state.numPlayers; p++) {
    const dealt = state.dealtHands ? state.dealtHands[p] : state.hands[p];
    const remaining = state.hands[p] || [];
    players[p] = {
      hand: dealt,
      playedCount: dealt.length - remaining.length,
    };
  }
  return {
    createdAt: state.roomCreatedAt || Date.now(),
    numPlayers: state.numPlayers,
    playerNames: state.playerNames,
    maxLevels: state.maxLevels,
    currentLevel: state.currentLevel,
    lives: state.lives,
    stars: state.stars,
    status,
    lastAction: state.lastAction
      ? { type: state.lastAction.type, player: state.lastAction.player ?? null, card: state.lastAction.card ?? null, ts: Date.now() }
      : null,
    players,
  };
}

function syncNow(status) {
  if (!state.isOnline || !state.roomCode) return;
  pushRoomState(state.roomCode, buildRoomSnapshot(status));
}

export function startLevel() {
  const deck = shuffle(Array.from({ length: 100 }, (_, i) => i + 1));
  const hands = [];
  for (let p = 0; p < state.numPlayers; p++) {
    hands.push(deck.splice(0, state.currentLevel).sort((a, b) => a - b));
  }
  state.hands = hands;
  state.dealtHands = hands.map(h => h.slice());

  state.centralPile = null;
  state.pileOwner = null;
  state.ninjaDiscards = new Array(state.numPlayers).fill(null);
  state.errorDiscards = new Array(state.numPlayers).fill(null);
  state.lastAction = null;
  state.pendingContinue = null;

  // En partidas online, tras el nivel 1 nos saltamos la pantalla de QR
  if (state.isOnline && state.currentLevel > 1) {
    state.screen = 'table';
  } else {
    state.screen = 'deal';
  }

  syncNow('playing');
}

function applyRewards(level) {
  const reward = REWARDS[level];
  if (reward === 'life') state.lives = Math.min(MAX_LIVES, state.lives + 1);
  if (reward === 'star') state.stars = Math.min(MAX_STARS, state.stars + 1);
}

function resolveTurnPause() {
  const levelDone = state.hands.every(h => h.length === 0);

  if (levelDone) {
    const finishedLevel = state.currentLevel;
    applyRewards(finishedLevel);
    const victory = finishedLevel >= state.maxLevels;
    state.pendingContinue = { type: 'levelup', level: finishedLevel, victory };
    if (victory) soundVictory(); else soundLevelUp();
    syncNow(victory ? 'victory' : 'levelup');
    return;
  }

  if (state.lastAction && state.lastAction.type === 'error') {
    state.pendingContinue = { type: 'error' };
  }
  syncNow('playing');
}

window.toggleSoundGlobal = () => {
  toggleSound(() => render());
};

window.playCard = (playerIndex) => {
  if (state.screen !== 'table' || state.pendingContinue) return;
  const hand = state.hands[playerIndex];
  if (!hand || hand.length === 0) return;

  const card = hand[0];
  const allLowest = Math.min(...state.hands.filter(h => h.length > 0).map(h => h[0]));

  hand.shift();

  if (state.ninjaDiscards && state.ninjaDiscards[playerIndex] !== undefined) {
    state.ninjaDiscards[playerIndex] = null;
  }

  if (card === allLowest) {
    state.centralPile = card;
    state.pileOwner = playerIndex + 1;
    state.lastAction = { type: 'ok', player: playerIndex + 1, card };
    soundOk();
  } else {
    state.lives -= 1;

    state.errorDiscards = new Array(state.numPlayers).fill(null);
    state.hands.forEach((h, idx) => {
      if (idx === playerIndex) return;
      const below = h.filter(c => c < card);
      if (below.length > 0) {
        state.errorDiscards[idx] = below;
      }
      state.hands[idx] = h.filter(c => c >= card);
    });

    state.centralPile = card;
    state.pileOwner = playerIndex + 1;
    state.lastAction = { type: 'error', player: playerIndex + 1, card, livesLeft: state.lives };
    soundError();
  }

  if (state.lives <= 0) {
    state.pendingContinue = { type: 'defeat' };
    soundDefeat();
    syncNow('error'); // los visores reciben el flash de error, aún no el estado final
    render();
    return;
  }

  resolveTurnPause();
  render();
};

window.useNinjaStar = () => {
  if (state.screen !== 'table' || state.pendingContinue) return;
  if (state.stars <= 0) return;
  const anyCards = state.hands.some(h => h.length > 0);
  if (!anyCards) return;

  showConfirmModal({
    badgeClass: 'badge-ninja',
    badgeHtml: '<span class="modal-shuriken"></span>',
    title: '¿Usar Estrella Ninja?',
    description: 'Se revelará y descartará la carta más baja de cada jugador.',
    confirmText: 'Usar estrella',
    cancelText: 'Cancelar',
    confirmBtnClass: 'btn-ninja',
    onConfirm: () => {
      if (state.screen !== 'table' || state.pendingContinue || state.stars <= 0) return;

      state.stars -= 1;
      const revealed = [];
      if (!state.ninjaDiscards || state.ninjaDiscards.length !== state.numPlayers) {
        state.ninjaDiscards = new Array(state.numPlayers).fill(null);
      }

      state.hands.forEach((h, idx) => {
        if (h.length > 0) {
          const card = h.shift();
          revealed.push({ player: idx + 1, card });
          state.ninjaDiscards[idx] = card;
        }
      });

      state.lastAction = { type: 'ninja', revealed };
      soundNinja();

      resolveTurnPause();
      render();
    },
  });
};

window.continueGame = () => {
  const pc = state.pendingContinue;
  if (!pc) return;
  state.pendingContinue = null;

  state.errorDiscards = new Array(state.numPlayers).fill(null);

  if (pc.type === 'levelup') {
    if (pc.victory) {
      state.screen = 'victory';
      syncNow('victory');
    } else {
      state.currentLevel = pc.level + 1;
      startLevel();
    }
  } else if (pc.type === 'error') {
    state.lastAction = null;
    syncNow('playing');
  } else if (pc.type === 'defeat') {
    state.screen = 'gameover';
    syncNow('gameover');
  }

  render();
};

window.confirmResetGame = () => {
  showConfirmModal({
    badgeClass: 'badge-warn',
    badgeHtml: '<span class="modal-warn-icon">⟲</span>',
    title: '¿Abandonar partida?',
    description: '¿Seguro que quieres salir y volver al inicio? Se perderá todo el progreso de la partida actual.',
    confirmText: 'Abandonar partida',
    cancelText: 'Seguir jugando',
    confirmBtnClass: 'btn-danger',
    onConfirm: () => {
      if (state.isOnline && state.roomCode) deleteRoom(state.roomCode);
      resetState();
      render();
    },
  });
};

window.confirmResetGameSilent = () => {
  if (state.isOnline && state.roomCode) deleteRoom(state.roomCode);
  resetState();
  render();
};

window.playAgainSamePlayers = () => {
  const n = state.numPlayers;
  const names = state.playerNames.slice();
  const wasOnline = state.isOnline;
  const oldRoomCode = state.roomCode;

  if (wasOnline && oldRoomCode) deleteRoom(oldRoomCode);

  resetState();

  state.numPlayers = n;
  state.playerNames = names;
  state.maxLevels = CONFIG[n].levels;
  state.lives = CONFIG[n].lives;
  state.stars = CONFIG[n].stars;
  state.currentLevel = 1;
  state.setupStep = 'count';

  // Nueva partida online: se genera una sala nueva y hay que reescanear una vez.
  state.isOnline = wasOnline;
  state.roomCode = null;

  startLevel();
  if (wasOnline) state.screen = 'deal';
  render();
};

function render() {
  const app = document.getElementById('app');
  switch (state.screen) {
    case 'setup':
      app.innerHTML = renderSetup(() => render());
      break;
    case 'deal':
      app.innerHTML = renderDeal(() => render());
      mountQrCodes();
      break;
    case 'table':
      app.innerHTML = renderTable();
      break;
    case 'gameover':
      app.innerHTML = renderGameOver();
      break;
    case 'victory':
      app.innerHTML = renderVictory();
      break;
    default:
      app.innerHTML = renderSetup(() => render());
  }
}

window.addEventListener('DOMContentLoaded', render);