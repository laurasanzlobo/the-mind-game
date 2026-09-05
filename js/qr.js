// File: js/qr.js
// Author: Laura Sanz Lobo

import { playerLabel } from './state.js';

export function buildBaseUrl() {
  return window.location.href.split('#')[0].split('?')[0];
}

function toPlayerHtmlUrl(base) {
  let url = base;
  if (url.endsWith('index.html')) {
    url = url.replace('index.html', 'player.html');
  } else if (!url.endsWith('/')) {
    url += '/player.html';
  } else {
    url += 'player.html';
  }
  return url;
}

// --- MODO ONLINE: QR apunta a ?room=XXXX&player=N (escaneo único) ---
export function buildOnlinePlayerUrl(roomCode, playerIndex) {
  const base = toPlayerHtmlUrl(buildBaseUrl());
  const name = playerLabel(playerIndex);
  const params = new URLSearchParams({
    room: roomCode,
    player: String(playerIndex),
    name,
  });
  return `${base}?${params.toString()}`;
}

export function parseRoomParams() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  const playerRaw = params.get('player');
  if (!room || playerRaw === null) return null;
  const player = parseInt(playerRaw, 10);
  if (isNaN(player)) return null;
  const nameRaw = params.get('name');
  return { room, player, name: nameRaw ? decodeURIComponent(nameRaw) : null };
}

// --- MODO OFFLINE (fallback): QR con datos embebidos en el hash ---
export function buildPlayerUrl(playerIndex, cards, level) {
  const base = toPlayerHtmlUrl(buildBaseUrl());
  const name = playerLabel(playerIndex);
  return base + '#player=' + (playerIndex + 1) + '&level=' + level + '&cards=' + cards.join(',') + '&name=' + encodeURIComponent(name);
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