import { useSyncExternalStore } from "react";

/**
 * Preferência "Animações calmas" (salva no aparelho).
 * Ligada: o companheiro fica na pose parada, sem reagir com movimento — para dias
 * em que a criança está mais sensível. Começa ligada se o sistema pede menos movimento.
 */
const KEY = "codey_calm_motion";

const systemPrefersReduced = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const load = (): boolean => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* ignore */
  }
  return systemPrefersReduced();
};

let calm = typeof window === "undefined" ? false : load();
const listeners = new Set<() => void>();

export const motionStore = {
  get: () => calm,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setCalm: (value: boolean) => {
    calm = value;
    try {
      localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
};

export const useCalmMotion = () => useSyncExternalStore(motionStore.subscribe, motionStore.get, motionStore.get);
