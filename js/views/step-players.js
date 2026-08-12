// File: js/views/step-players.js
// Author: Laura Sanz Lobo

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { renderDeviceToggle } from './step-device.js';
import { renderNameForm } from './step-names.js';

export function brandMark() {
  return '<div class="brand"><span class="brand-mark"></span><span>The Mind</span></div>';
}

export function renderSetup(renderCallback) {
  // Si ya he almacenado un número de jugadores, pinto automáticamente el formulario de nombres
  if (state.setupStep === 'names' && state.pendingNumPlayers) {
    return renderNameForm(renderCallback);
  }

  let options = '';
  [2, 3, 4].forEach(n => {
    const cfg = CONFIG[n];
    options += `
      <button class="player-opt" onclick="chooseNumPlayers(${n})">
        <span class="player-opt-num">${n}</span>
        <span class="player-opt-body">
          <span class="player-opt-label">${n} jugadores</span>
          <span class="player-opt-meta">${cfg.levels} niveles · ${cfg.lives} vidas · ${cfg.stars} estrella ninja</span>
        </span>
      </button>`;
  });

  window.chooseNumPlayers = (n) => {
    state.pendingNumPlayers = n;
    state.setupStep = 'names';
    if (renderCallback) renderCallback();
  };

  return `
    <div class="screen screen-setup">
      ${brandMark()}
      <div>
        <h1 class="setup-title">Juego The Mind</h1>
        <p class="setup-sub">Creado por Laura Sanz Lobo</p>
      </div>
      ${renderDeviceToggle(renderCallback)}
      <div class="player-select">${options}</div>
      <div class="footnote">Cada nivel se reparte en privado mediante un código QR individual. Cada persona verá exclusivamente su propia mano.</div>
    </div>`;
}