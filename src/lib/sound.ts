import { useSyncExternalStore } from "react";

/**
 * Sons do Codey — pensados para sensibilidade sensorial (TEA/TDAH):
 * - só timbres suaves (seno/triângulo), com entrada e saída de volume gradual (sem "clique")
 * - erro NUNCA é buzina: é um "hmm" descendente e baixinho
 * - volume máximo já é contido; a criança/responsável ajusta ou silencia com 1 toque
 * - anti-rajada: o mesmo som não se repete em menos de 90 ms
 * - sintetizado na hora (Web Audio): nada para baixar, nada para carregar
 */

export type SoundPrefs = { muted: boolean; volume: number }; // volume 0..1

const KEY = "codey_sound_prefs";
const DEFAULTS: SoundPrefs = { muted: false, volume: 0.5 };
const MAX_OUTPUT = 0.35; // teto global de ganho, mesmo com volume 100%

const load = (): SoundPrefs => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw);
    return {
      muted: typeof p.muted === "boolean" ? p.muted : DEFAULTS.muted,
      volume: typeof p.volume === "number" ? Math.min(1, Math.max(0, p.volume)) : DEFAULTS.volume,
    };
  } catch {
    return DEFAULTS;
  }
};

let prefs: SoundPrefs = typeof window === "undefined" ? DEFAULTS : load();
const listeners = new Set<() => void>();

const setPrefs = (next: SoundPrefs) => {
  prefs = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  if (master) master.gain.setTargetAtTime(effectiveGain(), ctx!.currentTime, 0.02);
  listeners.forEach((l) => l());
};

export const soundStore = {
  get: () => prefs,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setMuted: (muted: boolean) =>
    setPrefs({ muted, volume: !muted && prefs.volume <= 0 ? DEFAULTS.volume : prefs.volume }),
  toggleMuted: () =>
    setPrefs(prefs.muted ? { muted: false, volume: prefs.volume > 0 ? prefs.volume : DEFAULTS.volume } : { ...prefs, muted: true }),
  setVolume: (volume: number) => setPrefs({ ...prefs, volume: Math.min(1, Math.max(0, volume)), muted: volume <= 0 }),
};

// Outra aba mudou a preferência → acompanha.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    prefs = load();
    listeners.forEach((l) => l());
  });
}

// Atalho global "M" (registrado uma vez só; ignora quando está digitando).
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "m" || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const el = e.target as HTMLElement | null;
    if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
    soundStore.toggleMuted();
  });
}

export const useSoundPrefs = () => useSyncExternalStore(soundStore.subscribe, soundStore.get, soundStore.get);

// ---------------------------------------------------------------- engine
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

const effectiveGain = () => (prefs.muted ? 0 : prefs.volume * MAX_OUTPUT);

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = effectiveGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

type Note = { f: number; at?: number; dur?: number; type?: OscillatorType; gain?: number; to?: number };

const play = (notes: Note[]) => {
  if (prefs.muted || prefs.volume <= 0) return;
  const ac = getCtx();
  if (!ac || !master) return;
  const t0 = ac.currentTime + 0.01;
  for (const n of notes) {
    const start = t0 + (n.at ?? 0);
    const dur = n.dur ?? 0.18;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.f, start);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + dur);
    const peak = n.gain ?? 0.5;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }
};

const lastPlayed = new Map<string, number>();
const throttled = (name: string, notes: Note[]) => {
  const now = performance.now();
  if (now - (lastPlayed.get(name) ?? 0) < 90) return;
  lastPlayed.set(name, now);
  play(notes);
};

// Notas (Hz): escala pentatônica de Dó — sempre soa "harmoniosa", sem dissonância.
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.5, G4 = 392, E4 = 329.63;

export const sfx = {
  /** toque leve em botões de avançar/selecionar */
  tap: () => throttled("tap", [{ f: 880, dur: 0.06, gain: 0.18 }]),
  /** passinho do companheiro no labirinto */
  step: () => throttled("step", [{ f: G5, dur: 0.07, type: "triangle", gain: 0.2 }]),
  /** virar carta da memória */
  flip: () => throttled("flip", [{ f: 520, to: 780, dur: 0.09, gain: 0.2 }]),
  /** acerto: sininho ascendente */
  correct: () =>
    throttled("correct", [
      { f: C5, dur: 0.16, gain: 0.45 },
      { f: E5, at: 0.08, dur: 0.16, gain: 0.45 },
      { f: G5, at: 0.16, dur: 0.3, gain: 0.45 },
    ]),
  /** erro: "hmm" gentil e descendente — sem buzina, sem susto */
  wrong: () =>
    throttled("wrong", [
      { f: G4, dur: 0.18, type: "triangle", gain: 0.3 },
      { f: E4, at: 0.14, dur: 0.26, type: "triangle", gain: 0.26 },
    ]),
  /** escolha do companheiro */
  select: () =>
    throttled("select", [
      { f: D5, dur: 0.1, gain: 0.35 },
      { f: A5, at: 0.07, dur: 0.18, gain: 0.35 },
    ]),
  /** lição concluída: arpejo curto com brilho */
  complete: () =>
    throttled("complete", [
      { f: C5, dur: 0.18, gain: 0.4 },
      { f: E5, at: 0.11, dur: 0.18, gain: 0.4 },
      { f: G5, at: 0.22, dur: 0.18, gain: 0.4 },
      { f: C6, at: 0.33, dur: 0.45, gain: 0.4 },
      { f: E6, at: 0.45, dur: 0.35, gain: 0.12 },
    ]),
};
