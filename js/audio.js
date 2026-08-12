// File: js/audio.js
// Author: Laura Sanz Lobo

import { state } from './state.js';

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, delay, type, gainValue) {
  if (!state.soundOn) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  const startAt = ctx.currentTime + (delay || 0);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(gainValue || 0.06, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

export function soundOk() { playTone(720, 0.14, 0, 'sine', 0.05); }
export function soundError() { playTone(260, 0.28, 0, 'sawtooth', 0.05); playTone(180, 0.32, 0.1, 'sawtooth', 0.045); }
export function soundNinja() { playTone(660, 0.12, 0, 'triangle', 0.05); playTone(880, 0.16, 0.08, 'triangle', 0.05); playTone(1100, 0.18, 0.16, 'triangle', 0.045); }
export function soundLevelUp() { playTone(520, 0.14, 0, 'sine', 0.05); playTone(660, 0.14, 0.1, 'sine', 0.05); playTone(880, 0.22, 0.2, 'sine', 0.05); }
export function soundVictory() { playTone(660, 0.16, 0, 'sine', 0.05); playTone(880, 0.16, 0.14, 'sine', 0.05); playTone(1040, 0.16, 0.28, 'sine', 0.05); playTone(1320, 0.3, 0.42, 'sine', 0.05); }
export function soundDefeat() { playTone(220, 0.4, 0, 'sawtooth', 0.05); playTone(160, 0.5, 0.18, 'sawtooth', 0.045); }

export function toggleSound(renderCallback) {
  state.soundOn = !state.soundOn;
  if (state.soundOn) getAudioCtx();
  if (renderCallback) renderCallback();
}