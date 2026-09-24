import type { Reaction } from "@/lib/companionAnimations";

/**
 * Canal simples de "o companheiro deve reagir agora".
 * A lição chama reactCompanion("acerto"); todo companheiro animado na tela escuta e reage.
 */
type Listener = (r: Reaction) => void;
const listeners = new Set<Listener>();

export const reactCompanion = (r: Reaction) => listeners.forEach((l) => l(r));

export const onCompanionReaction = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
