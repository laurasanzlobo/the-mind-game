// File: js/views/step-device.js
// Author: Laura Sanz Lobo

import { state } from '../state.js';

export function renderDeviceToggle(renderCallback) {
  const isTablet = state.layoutMode === 'tablet';
  
  // Expongo la función globalmente para que funcione en los atributos onclick del HTML
  window.setLayoutMode = (mode) => {
    state.layoutMode = mode === 'tablet' ? 'tablet' : 'standard';
    if (renderCallback) renderCallback();
  };

  return `
    <div class="device-mode-toggle">
      <span class="device-mode-label">Disposición de la pantalla</span>
      <button class="device-mode-btn ${isTablet ? '' : 'is-active'}" onclick="setLayoutMode('standard')">
        <span class="device-mode-icon">💻</span>
        <span>Ordenador / Móvil</span>
      </button>
      <button class="device-mode-btn ${isTablet ? 'is-active' : ''}" onclick="setLayoutMode('tablet')">
        <span class="device-mode-icon">📱</span>
        <span>iPad / Tablet</span>
      </button>
    </div>
  `;
}