// js/views/table.js
import { state, playerLabel } from '../state.js';
import { REWARDS, MAX_LIVES, MAX_STARS } from '../config.js';
import { brandMark } from './step-players.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function rewardLabel(level) {
  const reward = REWARDS[level];
  if (reward === 'life') return '+1 Vida';
  if (reward === 'star') return '+1 Estrella Ninja';
  return null;
}

function renderPlayerIndicators(pIndex) {
  let chips = '';
  const ninjaCard = state.ninjaDiscards && state.ninjaDiscards[pIndex];
  if (ninjaCard !== null && ninjaCard !== undefined) {
    chips += `<div class="table-chip ninja">${ninjaCard}</div>`;
  }
  const errCards = state.errorDiscards && state.errorDiscards[pIndex];
  if (errCards && errCards.length > 0) {
    errCards.forEach(c => {
      chips += `<div class="table-chip error">${c}</div>`;
    });
  }
  return chips ? `<span class="player-discard-indicators">${chips}</span>` : '';
}

function renderLevelUpOverlay() {
  const pc = state.pendingContinue;
  if (!pc || pc.type !== 'levelup') return '';

  const btnLabel = pc.victory ? 'Ver resultado final' : 'Siguiente nivel';
  return `<div class="levelup-bar"><button class="btn btn-primary btn-compact" onclick="window.continueGame()">${btnLabel}</button></div>`;
}

// Coordenadas para el iPad (apaisado)
const TABLET_POSITIONS = {
  2: [
    'top:50%; left:12%; transform:translate(-50%,-50%) rotate(90deg);',
    'top:50%; left:88%; transform:translate(-50%,-50%) rotate(-90deg);',
  ],
  3: [
    'top:22%; left:10%; transform:translate(-50%,-50%) rotate(135deg);',
    'top:22%; left:90%; transform:translate(-50%,-50%) rotate(-135deg);',
    'top:78%; left:10%; transform:translate(-50%,-50%) rotate(45deg);',
  ],
  4: [
    'top:22%; left:10%; transform:translate(-50%,-50%) rotate(135deg);',
    'top:22%; left:90%; transform:translate(-50%,-50%) rotate(-135deg);',
    'top:78%; left:90%; transform:translate(-50%,-50%) rotate(-45deg);',
    'top:78%; left:10%; transform:translate(-50%,-50%) rotate(45deg);',
  ],
};

// He calculado las nuevas coordenadas verticales para el móvil
const MOBILE_POSITIONS = {
  2: [
    'top:12%; left:50%; transform:translate(-50%,-50%) rotate(180deg);',
    'top:88%; left:50%; transform:translate(-50%,-50%) rotate(0deg);',
  ],
  3: [
    'top:12%; left:50%; transform:translate(-50%,-50%) rotate(180deg);',
    'top:88%; left:22%; transform:translate(-50%,-50%) rotate(0deg);',
    'top:88%; left:78%; transform:translate(-50%,-50%) rotate(0deg);',
  ],
  4: [
    'top:12%; left:25%; transform:translate(-50%,-50%) rotate(180deg);',
    'top:12%; left:75%; transform:translate(-50%,-50%) rotate(180deg);',
    'top:88%; left:75%; transform:translate(-50%,-50%) rotate(0deg);',
    'top:88%; left:25%; transform:translate(-50%,-50%) rotate(0deg);',
  ],
};

export function renderTable() {
  let livesDots = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    livesDots += `<span class="life-dot${i < state.lives ? ' filled' : ''}"></span>`;
  }
  let starsDots = '';
  for (let i = 0; i < MAX_STARS; i++) {
    starsDots += `<span class="shuriken${i < state.stars ? ' filled' : ''}"></span>`;
  }

  const paused = !!state.pendingContinue;
  const isTablet = state.layoutMode === 'tablet';
  const isMobile = state.layoutMode === 'mobile';
  const isCircular = isTablet || isMobile;

  let positions = null;
  if (isTablet && TABLET_POSITIONS[state.numPlayers]) positions = TABLET_POSITIONS[state.numPlayers];
  if (isMobile && MOBILE_POSITIONS[state.numPlayers]) positions = MOBILE_POSITIONS[state.numPlayers];

  let playerButtons = '';
  for (let p = 0; p < state.numPlayers; p++) {
    const remaining = state.hands[p].length;
    const disabled = (remaining === 0 || paused) ? 'disabled' : '';
    const posStyle = positions ? ` style="${positions[p]}"` : '';
    
    const isIlluminated = (state.pileOwner === p + 1) ? ' is-illuminated' : '';
    const indicators = renderPlayerIndicators(p);
    
    playerButtons += `
      <button class="player-btn${isIlluminated}"${posStyle} ${disabled} onclick="window.playCard(${p}); this.blur();">
        ${indicators}
        <span class="player-btn-name">${escapeHtml(playerLabel(p))}</span>
        <span class="player-btn-count">${remaining} carta${remaining === 1 ? '' : 's'}</span>
      </button>`;
  }

  const pileEmpty = state.centralPile === null;
  const ninjaDisabled = (state.stars <= 0 || paused) ? 'disabled' : '';

  const pileCaption = pileEmpty
    ? 'Esperando primera carta'
    : `Lanzada por <b>${escapeHtml(playerLabel(state.pileOwner - 1))}</b>`;

  const isLevelUp = state.pendingContinue && state.pendingContinue.type === 'levelup' && !state.pendingContinue.victory;
  const isError = state.lastAction && state.lastAction.type === 'error';

  let pileMessage = '';
  if (isLevelUp) {
    pileMessage = '<span class="pile-success">¡Nivel superado!</span>';
  } else if (isError) {
    pileMessage = '<span class="pile-error">¡Fallo!</span>';
  }

  const pileHtml = `
    <div class="pile-wrap">
      <div class="pile-ring"><span class="pile-number${pileEmpty ? ' is-empty' : ''}">${pileEmpty ? 'listos' : state.centralPile}</span></div>
      <span class="pile-caption">${pileCaption}</span>
      ${pileMessage}
    </div>`;

  const tableAreaHtml = isCircular
    ? `<div class="round-table${isMobile ? ' layout-mobile-table' : ''}">${pileHtml}${playerButtons}</div>`
    : `<div class="table-area">${pileHtml}<div class="players-grid">${playerButtons}</div></div>`;

  const errorContinueHtml = (state.pendingContinue && state.pendingContinue.type === 'error')
    ? '<div class="continue-bar"><button class="btn btn-primary btn-block" onclick="window.continueGame()">Continuar partida</button></div>'
    : '';

  const rewardType = REWARDS[state.currentLevel];
  const reward = rewardLabel(state.currentLevel);
  const rewardCls = rewardType === 'life' ? 'reward-life' : rewardType === 'star' ? 'reward-star' : '';
  const levelRewardHtml = reward ? `<span class="level-reward ${rewardCls}">Recompensa: ${reward}</span>` : '';

  return `
    <div class="screen screen-table${isCircular ? ' layout-tablet' : ''}">
      <div class="topbar">
        ${brandMark()}
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" onclick="window.toggleSoundGlobal()" aria-label="Silenciar avisos sonoros" title="Sonido">${state.soundOn ? '♪' : '×'}</button>
          <button class="icon-btn" onclick="window.confirmResetGame()" aria-label="Abandonar partida" title="Volver al inicio">⟲</button>
        </div>
      </div>

      <div class="level-heading">
        <div class="level-heading-row">
          <h2>Nivel ${state.currentLevel} de ${state.maxLevels}</h2>
          ${levelRewardHtml}
        </div>
      </div>

      <div class="stat-row">
        <div class="stat"><span class="stat-label">Vidas</span><div class="dot-row">${livesDots}</div></div>
        <div class="stat"><span class="stat-label">Estrellas ninja</span><div class="dot-row">${starsDots}</div></div>
      </div>

      ${tableAreaHtml}

      <button class="btn ninja-btn btn-block" ${ninjaDisabled} onclick="window.useNinjaStar()">
        <span class="shuriken"></span><span>Usar estrella ninja</span>
      </button>

      ${errorContinueHtml}
      ${renderLevelUpOverlay()}
    </div>`;
}

export function renderGameOver() {
  return `
    <div class="screen end-screen">
      ${brandMark()}
      <div class="end-emblem defeat">✕</div>
      <h1 class="end-title">Os habéis quedado sin vidas :(</h1>
      <p class="end-sub">Habéis llegado hasta el nivel ${state.currentLevel} de ${state.maxLevels} con ${state.numPlayers} jugadores.</p>
      <div class="end-actions">
        <button class="btn btn-primary btn-block" onclick="window.playAgainSamePlayers()">Reintentar con ${state.numPlayers} jugadores</button>
        <button class="btn btn-ghost btn-block" onclick="window.confirmResetGameSilent()">Cambiar número de jugadores</button>
      </div>
    </div>`;
}

export function renderVictory() {
  return `
    <div class="screen end-screen">
      ${brandMark()}
      <div class="end-emblem victory">◐</div>
      <h1 class="end-title">Sincronía perfecta</h1>
      <p class="end-sub">Habéis completado los ${state.maxLevels} niveles con ${state.numPlayers} jugadores, terminando con ${state.lives} vida${state.lives === 1 ? '' : 's'} y ${state.stars} estrella${state.stars === 1 ? '' : 's'} ninja.</p>
      <div class="end-actions">
        <button class="btn btn-primary btn-block" onclick="window.playAgainSamePlayers()">Jugar otra vez con ${state.numPlayers}</button>
        <button class="btn btn-ghost btn-block" onclick="window.confirmResetGameSilent()">Cambiar número de jugadores</button>
      </div>
    </div>`;
}