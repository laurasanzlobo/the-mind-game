// File: js/views/step-names.js
// Author: Laura Sanz Lobo

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { brandMark } from './step-players.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderNameForm(renderCallback) {
  const n = state.pendingNumPlayers;
  let fields = '';
  
  for (let p = 0; p < n; p++) {
    const existing = state.playerNames && state.playerNames[p] ? state.playerNames[p] : '';
    fields += `
      <div class="name-field">
        <label for="name-input-${p}">Jugador ${p + 1}</label>
        <input type="text" id="name-input-${p}" placeholder="Nombre" value="${escapeHtml(existing)}" maxlength="24" autocomplete="off">
      </div>`;
  }

  window.confirmPlayerNames = () => {
    const num = state.pendingNumPlayers;
    if (!num) return;

    const names = [];
    for (let p = 0; p < num; p++) {
      const input = document.getElementById(`name-input-${p}`);
      const value = input ? input.value.trim() : '';
      names.push(value || `Jugador ${p + 1}`);
    }

    const cfg = CONFIG[num];
    state.playerNames = names;
    state.numPlayers = num;
    state.maxLevels = cfg.levels;
    state.lives = cfg.lives;
    state.stars = cfg.stars;
    state.currentLevel = 1;
    state.setupStep = 'count';
    state.pendingNumPlayers = null;
    
    state.screen = 'deal';
    
    import('../main.js').then(module => {
      module.startLevel();
      if (renderCallback) renderCallback();
    });
  };

  window.backToPlayerCount = () => {
    state.setupStep = 'count';
    state.pendingNumPlayers = null;
    if (renderCallback) renderCallback();
  };

  return `
    <div class="screen screen-setup">
      ${brandMark()}
      <div>
        <h1 class="setup-title">Nombres de los jugadores</h1>
      </div>
      
      <div class="setup-content-wrapper">
        <div class="name-form">${fields}</div>
        <div class="name-form-actions">
          <button class="btn btn-primary btn-block" onclick="confirmPlayerNames()">Comenzar partida</button>
          <button class="btn btn-ghost btn-block" onclick="backToPlayerCount()">Volver</button>
        </div>
      </div>
      
      <div class="footnote">Creado por Laura Sanz Lobo</div>
    </div>`;
}