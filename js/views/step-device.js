// File: js/views/step-device.js
// Author: Laura Sanz Lobo

import { state } from '../state.js';

export function renderDeviceToggle(renderCallback) {
  const mode = state.layoutMode;
  
  // Expongo la función globalmente para que funcione en los atributos onclick del HTML
  window.setLayoutMode = (newMode) => {
    state.layoutMode = newMode;
    if (renderCallback) renderCallback();
  };

  return `
    <div class="device-mode-toggle">
      <span class="device-mode-label">Disposición de la pantalla</span>
      <button class="device-mode-btn ${mode === 'standard' ? 'is-active' : ''}" onclick="window.setLayoutMode('standard')">
        <span class="device-mode-icon">💻</span>
        <span>Ordenador</span>
      </button>
      <button class="device-mode-btn ${mode === 'mobile' ? 'is-active' : ''}" onclick="window.setLayoutMode('mobile')">
        <span class="device-mode-icon">📱</span>
        <span>Móvil</span>
      </button>
      <button class="device-mode-btn ${mode === 'tablet' ? 'is-active' : ''}" onclick="window.setLayoutMode('tablet')">
        <span class="device-mode-icon">🔄</span>
        <span>iPad / Tablet (Mesa Redonda)</span>
      </button>
    </div>
  `;
}