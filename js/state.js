// File: js/state.js
// Author: Laura Sanz Lobo

export const state = {
  screen: 'setup', 
  setupStep: 'count', 
  pendingNumPlayers: null, 
  numPlayers: null,
  playerNames: [], 
  maxLevels: null,
  currentLevel: 1,
  lives: 0,
  stars: 0,
  hands: [],        
  centralPile: null, 
  pileOwner: null,
  ninjaDiscards: [], 
  errorDiscards: [], 
  lastAction: null,  
  soundOn: true,
  layoutMode: 'standard', 
  pendingContinue: null,  
};

export function resetState() {
  state.screen = 'setup';
  state.setupStep = 'count';
  state.pendingNumPlayers = null;
  state.numPlayers = null;
  state.playerNames = [];
  state.maxLevels = null;
  state.currentLevel = 1;
  state.lives = 0;
  state.stars = 0;
  state.hands = [];
  state.centralPile = null;
  state.pileOwner = null;
  state.ninjaDiscards = [];
  state.errorDiscards = [];
  state.lastAction = null;
  // soundOn y layoutMode se mantienen entre partidas
  state.pendingContinue = null;
}

export function playerLabel(playerIndex) {
  const name = state.playerNames && state.playerNames[playerIndex];
  return (name && name.trim()) ? name.trim() : 'Jugador ' + (playerIndex + 1);
}