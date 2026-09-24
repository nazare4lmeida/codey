/**
 * Animações dos companheiros (recortadas dos vídeos da autora).
 *
 * Cada emoção é uma folha de quadros (sprite sheet) em src/assets/anim/<companheiro>-<emoção>.webp.
 * Para acrescentar uma emoção nova quando chegar um vídeo:
 *   1. salve a folha em src/assets/anim/<id>-<emoção>.webp
 *   2. registre os dados dela abaixo
 * Nada mais precisa mudar: o jogo passa a usar a emoção sozinho (ver pickClip).
 */

export type ClipName = "parado" | "feliz" | "calminho" | "pensando" | "tonto" | "triste" | "assustada";

export type ClipMeta = { frames: number; cols: number; size: number; fps: number; loop: boolean };

export type CompanionAnimation = Partial<Record<ClipName, ClipMeta>> & { parado: ClipMeta };

export const ANIMATIONS: Record<string, CompanionAnimation> = {
  vix: {
    feliz: { frames: 32, cols: 8, size: 200, fps: 12, loop: false },
    triste: { frames: 31, cols: 8, size: 200, fps: 12, loop: false },
    pensando: { frames: 32, cols: 8, size: 200, fps: 12, loop: false },
    tonto: { frames: 16, cols: 8, size: 200, fps: 12, loop: false },
    parado: { frames: 22, cols: 8, size: 200, fps: 12, loop: true },
  },
  brasa: {
    feliz: { frames: 28, cols: 8, size: 200, fps: 12, loop: false },
    parado: { frames: 24, cols: 8, size: 200, fps: 12, loop: true },
    calminho: { frames: 18, cols: 8, size: 200, fps: 12, loop: false },
  },
  nuvi: {
    feliz: { frames: 28, cols: 8, size: 200, fps: 12, loop: false },
    parado: { frames: 24, cols: 8, size: 200, fps: 12, loop: true },
    calminho: { frames: 18, cols: 8, size: 200, fps: 12, loop: false },
  },
  musgo: {
    feliz: { frames: 28, cols: 8, size: 200, fps: 12, loop: false },
    parado: { frames: 24, cols: 8, size: 200, fps: 12, loop: true },
    calminho: { frames: 18, cols: 8, size: 200, fps: 12, loop: false },
  },
  marola: {
    feliz: { frames: 28, cols: 8, size: 200, fps: 12, loop: false },
    parado: { frames: 24, cols: 8, size: 200, fps: 12, loop: true },
    calminho: { frames: 18, cols: 8, size: 200, fps: 12, loop: false },
  },
  astro: {
    feliz: { frames: 28, cols: 8, size: 200, fps: 12, loop: false },
    parado: { frames: 24, cols: 8, size: 200, fps: 12, loop: true },
    calminho: { frames: 18, cols: 8, size: 200, fps: 12, loop: false },
  },
  // Lily: companheira exclusiva do painel admin (não aparece na escolha da criança).
  // parado = trecho "feliz" do vídeo em vai-e-volta; ao clicar alterna pensando/assustada; triste fica guardada.
  lily: {
    parado: { frames: 54, cols: 8, size: 200, fps: 12, loop: true },
    pensando: { frames: 18, cols: 8, size: 200, fps: 12, loop: false },
    assustada: { frames: 20, cols: 8, size: 200, fps: 12, loop: false },
    triste: { frames: 56, cols: 8, size: 200, fps: 12, loop: false },
  },
};

// URLs das folhas (Vite resolve em build; os bytes só são baixados quando usados).
const SHEET_URLS = import.meta.glob("@/assets/anim/*.webp", { eager: true, query: "?url", import: "default" }) as Record<
  string,
  string
>;

export const sheetUrl = (id: string, clip: ClipName): string | undefined => {
  const key = Object.keys(SHEET_URLS).find((k) => k.endsWith(`/${id}-${clip}.webp`));
  return key ? SHEET_URLS[key] : undefined;
};

export const getAnimation = (id?: string | null): CompanionAnimation | null => (id && ANIMATIONS[id]) || null;

/** O que acontece no jogo. */
export type Reaction = "acerto" | "erro" | "erro-seguido" | "fim";

/**
 * Escolhe a emoção para cada situação, usando a melhor que o companheiro tiver:
 * - acerto / fim de lição → feliz
 * - erro → pensando; se não tiver, calminho
 * - 2º erro seguido → tonto; se não tiver, cai no erro normal
 * "triste" nunca é usado automaticamente (pesado demais logo após um erro).
 */
export const pickClip = (anim: CompanionAnimation, reaction: Reaction): ClipName | null => {
  const has = (c: ClipName) => (anim[c] ? c : null);
  switch (reaction) {
    case "acerto":
    case "fim":
      return has("feliz");
    case "erro":
      return has("pensando") ?? has("calminho");
    case "erro-seguido":
      return has("tonto") ?? has("pensando") ?? has("calminho");
  }
};
