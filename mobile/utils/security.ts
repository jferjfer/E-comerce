/**
 * EGOS Mobile — Utilidades de Seguridad
 * Centraliza todas las operaciones sensibles de seguridad
 */

import * as SecureStore from 'expo-secure-store';

// ── 1. ALMACENAMIENTO SEGURO (cifrado AES-256) ────────────────
export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (e) {
      console.warn('SecureStore.set error:', (e as any).message);
    }
  },
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

// ── 2. SANITIZACIÓN DE LOGS ───────────────────────────────────
const SENSITIVE = [
  /Bearer\s+[\w.-]+/gi,
  /token["\s:=]+["']?[\w.-]+/gi,
  /password["\s:=]+["']?\S+/gi,
  /\r?\n/g,
  /\r/g,
];

const sanitizeArg = (arg: any): any => {
  if (typeof arg === 'string') {
    return SENSITIVE.reduce((s, p) => s.replace(p, '[REDACTED]'), arg).slice(0, 300);
  }
  if (typeof arg === 'object') {
    try {
      return SENSITIVE.reduce((s, p) => s.replace(p, '[REDACTED]'), JSON.stringify(arg)).slice(0, 200);
    } catch { return '[Object]'; }
  }
  return arg;
};

export const safeLog = (prefix: string, ...args: any[]): void => {
  if (__DEV__) console.log(prefix, ...args.map(sanitizeArg));
};

export const safeError = (prefix: string, ...args: any[]): void => {
  if (__DEV__) console.error(prefix, ...args.map(sanitizeArg));
};

// ── 3. SANITIZACIÓN DE INPUTS ─────────────────────────────────
export const sanitize = {
  text:     (s: string) => s.replace(/[<>'";&\\]/g, '').trim().slice(0, 500),
  nombre:   (s: string) => s.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim().slice(0, 100),
  numerico: (s: string) => s.replace(/[^0-9]/g, '').slice(0, 20),
  email:    (s: string) => s.toLowerCase().trim().slice(0, 254),
};

// ── 4. VALIDACIÓN DE CONTRASEÑA ───────────────────────────────
export const validarPassword = (p: string): { valida: boolean; errores: string[] } => {
  const errores: string[] = [];
  if (p.length < 8)         errores.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(p))    errores.push('Al menos una mayúscula');
  if (!/[0-9]/.test(p))    errores.push('Al menos un número');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p))
    errores.push('Al menos un carácter especial');
  return { valida: errores.length === 0, errores };
};

// ── 5. RATE LIMITING cliente (anti fuerza bruta) ──────────────
const intentos = new Map<string, { count: number; last: number }>();

export const verificarRateLimit = (email: string): { permitido: boolean; esperarSegundos?: number } => {
  const ahora = Date.now();
  const MAX = 5;
  const VENTANA = 5 * 60 * 1000;
  const BLOQUEO = 15 * 60 * 1000;
  const reg = intentos.get(email);
  if (!reg || ahora - reg.last > VENTANA) {
    intentos.set(email, { count: 1, last: ahora });
    return { permitido: true };
  }
  if (reg.count >= MAX) {
    const espera = Math.ceil((reg.last + BLOQUEO - ahora) / 1000);
    if (espera > 0) return { permitido: false, esperarSegundos: espera };
    intentos.set(email, { count: 1, last: ahora });
    return { permitido: true };
  }
  reg.count++;
  reg.last = ahora;
  return { permitido: true };
};

export const limpiarRateLimit = (email: string): void => { intentos.delete(email); };

// ── 6. TIMEOUT DE SESIÓN (30 min inactividad) ─────────────────
const TIMEOUT_MS = 30 * 60 * 1000;
let lastActivity = Date.now();

export const actualizarActividad = (): void => { lastActivity = Date.now(); };
export const verificarSesionActiva = (): boolean => Date.now() - lastActivity < TIMEOUT_MS;
