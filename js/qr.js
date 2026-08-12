// File: js/qr.js
// Author: Laura Sanz Lobo

import { playerLabel } from './state.js';

export function buildBaseUrl() {
  return window.location.href.split('#')[0];
}

export function buildPlayerUrl(playerIndex, cards, level) {
  const base = buildBaseUrl();
  const name = playerLabel(playerIndex);
  
  // Modificamos la URL base para que apunte al visor móvil
  let url = base;
  if (url.endsWith('index.html')) {
    url = url.replace('index.html', 'player.html');
  } else if (!url.endsWith('/')) {
    url += '/player.html';
  } else {
    url += 'player.html';
  }
  
  return url + '#player=' + (playerIndex + 1) + '&level=' + level + '&cards=' + cards.join(',') + '&name=' + encodeURIComponent(name);
}

export function parseHash() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return null;
  try {
    const params = new URLSearchParams(raw);
    const player = params.get('player');
    const cardsRaw = params.get('cards');
    if (!player || !cardsRaw) return null;
    const cards = cardsRaw.split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const level = params.get('level') ? parseInt(params.get('level'), 10) : null;
    const nameRaw = params.get('name');
    const name = nameRaw ? decodeURIComponent(nameRaw) : null;
    return { player: parseInt(player, 10), level, cards, name };
  } catch(e) {
    return null;
  }
}