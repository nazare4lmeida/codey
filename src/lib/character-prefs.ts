/**
 * Escolhas do criador de personagem que MUDAM o jogo.
 * Os índices são salvos no banco (characters.outfit_color e characters.ability):
 * nunca reordene; só acrescente no fim.
 */

/** Aura: brilho suave da cor escolhida atrás do companheiro, em todas as telas. */
export const AURAS = [
  { name: "Turquesa", cssVar: "--codey-turquoise", swatch: "bg-codey-turquoise" },
  { name: "Âmbar", cssVar: "--codey-amber", swatch: "bg-codey-amber" },
  { name: "Lavanda", cssVar: "--codey-lavender", swatch: "bg-codey-lavender" },
  { name: "Musgo", cssVar: "--codey-moss", swatch: "bg-codey-moss" },
  { name: "Coral", cssVar: "--codey-coral", swatch: "bg-codey-coral" },
  { name: "Céu", cssVar: "--codey-sky", swatch: "bg-codey-sky" },
] as const;

export const isValidAura = (i: unknown): i is number => typeof i === "number" && Number.isInteger(i) && i >= 0 && i < AURAS.length;

/** Gradiente da aura (usado como background de um elemento atrás do companheiro). */
export const auraGradient = (i: number | null | undefined) => {
  const a = AURAS[isValidAura(i) ? i : 0];
  return `radial-gradient(circle at 50% 55%, hsl(var(${a.cssVar}) / 0.55) 0%, hsl(var(${a.cssVar}) / 0.22) 45%, transparent 70%)`;
};

/**
 * Estilos de apoio. Só aparecem na escolha os que o jogo realmente cumpre (visible: true).
 * 1 e 2 dependem de conteúdo que as lições ainda não têm; ficam guardados sem aparecer,
 * para não prometer à criança algo que não acontece.
 */
export const SUPPORT_STYLES = [
  { id: 0, icon: "💡", name: "Dicas suaves", desc: "Quando eu errar, a dica aparece sozinha junto da explicação.", visible: true },
  { id: 1, icon: "🧩", name: "Passo a passo", desc: "Quebrar o problema em partes menores.", visible: false },
  { id: 2, icon: "🧪", name: "Testar primeiro", desc: "Ver exemplos antes de responder.", visible: false },
  { id: 3, icon: "🌿", name: "Modo calmo", desc: "Sem corações para perder e sem pressa: erro não tira nada.", visible: true },
] as const;

export const SUPPORT = { dicas: 0, calmo: 3 } as const;

export const isValidSupport = (i: unknown): i is number =>
  typeof i === "number" && Number.isInteger(i) && i >= 0 && i < SUPPORT_STYLES.length;
