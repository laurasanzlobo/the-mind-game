// File: js/views/step-players.js
// Author: Laura Sanz Lobo

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { renderDeviceToggle } from './step-device.js';
import { renderNameForm } from './step-names.js';

export function brandMark() {
  return '<div class="brand" style="justify-content: center;"><span class="brand-mark"></span><span>The Mind</span></div>';
}

export function renderSetup(renderCallback) {
  if (state.setupStep === 'names' && state.pendingNumPlayers) {
    return renderNameForm(renderCallback);
  }

  let options = '';
  [2, 3, 4].forEach(n => {
    const cfg = CONFIG[n];
    const isActive = state.pendingNumPlayers === n ? ' is-active' : '';
    
    options += `
      <button class="player-opt${isActive}" onclick="window.selectNumPlayers(${n})">
        <span class="player-opt-num">${n}</span>
        <span class="player-opt-body">
          <span class="player-opt-label">${n} jugadores</span>
          <span class="player-opt-meta">${cfg.levels} niveles · ${cfg.lives} vidas · ${cfg.stars} estrella ninja</span>
        </span>
      </button>`;
  });

  // Guardar la selección visualmente sin cambiar de pantalla
  window.selectNumPlayers = (n) => {
    state.pendingNumPlayers = n;
    if (renderCallback) renderCallback();
  };

  // Pasar a la pantalla de nombres solo al pulsar "Comenzar"
  window.goToNames = () => {
    if (!state.pendingNumPlayers) return;
    state.setupStep = 'names';
    if (renderCallback) renderCallback();
  };

  const isBtnDisabled = !state.pendingNumPlayers ? 'disabled' : '';

  return `
    <div class="screen screen-setup">
      ${brandMark()}
      <div>
        <h1 class="setup-title">Juego The Mind</h1>
      </div>
      
      <div class="setup-content-wrapper">
        ${renderDeviceToggle(renderCallback)}
        
        <div class="player-select">
          <span class="device-mode-label">Número de jugadores</span>
          ${options}
        </div>

        <button class="btn btn-primary btn-block" ${isBtnDisabled} onclick="window.goToNames()">Comenzar</button>
      </div>

      <div class="footnote">Creado por Laura Sanz Lobo</div>
    </div>`;
}