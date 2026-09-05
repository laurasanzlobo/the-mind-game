// File: js/services/sync.js
// Author: Laura Sanz Lobo
// Aísla toda la interacción con Firebase Realtime Database.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getDatabase, ref, set, update, onValue, off, get
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { firebaseConfig } from "../firebase-config.js";

let app = null;
let db = null;

function getDb() {
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos

export function generateRoomCode(length = 4) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// Comprueba disponibilidad del código (colisión improbable, pero por si acaso)
export async function isRoomCodeFree(roomCode) {
  const snap = await get(ref(getDb(), `rooms/${roomCode}`));
  return !snap.exists();
}

export async function createUniqueRoomCode() {
  let code = generateRoomCode();
  let attempts = 0;
  while (!(await isRoomCodeFree(code)) && attempts < 5) {
    code = generateRoomCode();
    attempts++;
  }
  return code;
}

/**
 * Escribe una foto completa del estado de la sala.
 * snapshot debe seguir la forma documentada en /rooms/{code}.
 */
export async function pushRoomState(roomCode, snapshot) {
  if (!roomCode) return;
  try {
    await set(ref(getDb(), `rooms/${roomCode}`), snapshot);
  } catch (err) {
    console.error('[sync] Error al escribir el estado de la sala:', err);
  }
}

/**
 * Actualización parcial (solo se usa para status/lastAction puntuales
 * cuando no queremos reescribir todo, p.ej. reset de sala).
 */
export async function patchRoomState(roomCode, partial) {
  if (!roomCode) return;
  try {
    await update(ref(getDb(), `rooms/${roomCode}`), partial);
  } catch (err) {
    console.error('[sync] Error al actualizar la sala:', err);
  }
}

/**
 * Suscripción de la mesa o de un visor al nodo completo de la sala.
 * callback recibe el objeto snapshot (o null si la sala no existe / fue borrada).
 * Devuelve una función para cancelar la suscripción.
 */
export function subscribeRoom(roomCode, callback) {
  const roomRef = ref(getDb(), `rooms/${roomCode}`);
  const listener = onValue(roomRef, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  }, (err) => {
    console.error('[sync] Error en la suscripción:', err);
    callback(null);
  });
  return () => off(roomRef, 'value', listener);
}

export async function deleteRoom(roomCode) {
  if (!roomCode) return;
  try {
    await set(ref(getDb(), `rooms/${roomCode}`), null);
  } catch (err) {
    console.error('[sync] Error al borrar la sala:', err);
  }
}