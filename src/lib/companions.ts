// Catálogo ÚNICO de companheiros. A ordem é persistida no banco
// (characters.accessory = índice), então NUNCA reordene nem remova itens:
// só acrescente novos no final.
import companionFox from "@/assets/companion-fox.webp";
import companionBrasa from "@/assets/companion-brasa.webp";
import companionNuvi from "@/assets/companion-nuvi.webp";
import companionMusgo from "@/assets/companion-musgo.webp";
import companionMarola from "@/assets/companion-marola.webp";
import companionAstro from "@/assets/companion-astro.webp";
import mascotImg from "@/assets/codey-mascot.webp";

export type Companion = {
  /** chave estável (usada nas animações: src/assets/anim/<id>-<emoção>.webp) */
  id: string;
  img: string;
  name: string;
  desc: string;
  celebrate: string[];
  encourage: string[];
};

// Cada posição herdou o tema do companheiro antigo, para quem já tinha escolhido:
// 1 dragão → Brasa · 2 coruja lilás → Nuvi · 3 cervo → Musgo · 4 tartaruga (calma) → Marola · 5 lobo astral → Astro
export const companionList: Companion[] = [
  {
    id: "vix",
    img: companionFox,
    name: "Vix",
    desc: "Raposinha de cauda cristalina. Fareja atalhos elegantes no código.",
    celebrate: ["Atalho perfeito! ✨", "Você farejou a resposta certa.", "Cauda cristalina aprovando!"],
    encourage: ["Sem stress, vamos achar outro caminho.", "Erro é só uma pista nova.", "Respira e tenta de novo, eu confio em você."],
  },
  {
    id: "brasa",
    img: companionBrasa,
    name: "Brasa",
    desc: "Filhote de dragão de lava com juba de fogo. Não desiste fácil: cada erro vira combustível.",
    celebrate: ["Isso pegou fogo! 🔥", "Resposta quentinha e certeira!", "Sua lógica brilhou como brasa."],
    encourage: ["Calma, até o fogo começa com uma faísca.", "Respira. A gente acende de novo.", "Erro é só lenha pra próxima tentativa."],
  },
  {
    id: "nuvi",
    img: companionNuvi,
    name: "Nuvi",
    desc: "Grifinho lilás de asas macias e cauda de nuvem. Enxerga padrões lá do alto.",
    celebrate: ["Voou alto nessa!", "Olhar de grifo: padrão encontrado!", "Leve como nuvem, certeiro como flecha."],
    encourage: ["Vamos olhar de cima de novo, com calma.", "Até grifos treinam o voo.", "Pousa, respira e tenta outra vez."],
  },
  {
    id: "musgo",
    img: companionMusgo,
    name: "Musgo",
    desc: "Filhote da floresta com orelhas de folha, galhos na cabeça e uma flor de lótus na cauda. Cresce um pouquinho a cada passo.",
    celebrate: ["A floresta toda comemorou! 🌿", "Mais um broto de conhecimento!", "Raiz firme, resposta certa."],
    encourage: ["Plantinhas crescem devagar, e tudo bem.", "Volta um passo, a trilha continua aqui.", "Cada erro é adubo pro próximo acerto."],
  },
  {
    id: "marola",
    img: companionMarola,
    name: "Marola",
    desc: "Axolote azul com chifrinhos e guelras de coral. Tranquilo como água parada, ensina a ter paciência.",
    celebrate: ["Splash! Acertou! 💧", "Mandou bem, com calma e jeitinho.", "Onda boa de acerto!"],
    encourage: ["Vamos com calma, como a maré.", "Axolotes se regeneram. A gente tenta de novo.", "Respira fundo, lê de novo, sem pressa."],
  },
  {
    id: "astro",
    img: companionAstro,
    name: "Astro",
    desc: "Ursinho cósmico com antenas de constelação e cristais nas bochechas. Liga os pontos como estrelas no céu.",
    celebrate: ["Brilhou mais que uma estrela! ✨", "Constelação completa!", "Você ligou todos os pontos!"],
    encourage: ["Até as estrelas levam tempo pra brilhar.", "Vamos ligar os pontos de novo, juntos.", "Uma estrela apagou? Tem um céu inteiro pra tentar."],
  },
  {
    id: "codey",
    img: mascotImg,
    name: "Codey",
    desc: "O mascote do Codey: uma bolinha de cristal curiosa que acompanha você desde o começo.",
    celebrate: ["Boa! Você arrasou!", "Brilhante!", "Mais uma joia conquistada!"],
    encourage: ["Tudo bem errar, vamos de novo.", "Cada erro ensina algo.", "Não desista, você está perto."],
  },
];

// Usado quando ainda não há companheiro escolhido (ou o índice salvo é inválido).
export const fallbackCompanion: Companion = companionList[6];

export const isValidCompanionIndex = (index: unknown): index is number =>
  typeof index === "number" && Number.isInteger(index) && index >= 0 && index < companionList.length;

export const getCompanion = (index?: number | null): Companion =>
  isValidCompanionIndex(index) ? companionList[index] : fallbackCompanion;

export const codeyTips: string[] = [
  "💡 No VS Code, use Ctrl + D para selecionar a próxima ocorrência da palavra.",
  "💡 Ctrl + / comenta e descomenta a linha atual rapidinho.",
  "💡 console.log({ variavel }) mostra o nome junto do valor — ótimo pra debug.",
  "💡 Use nomes claros pra variáveis: 'totalAlunos' é melhor que 'x'.",
  "💡 Indentar bem o código deixa tudo mais fácil de ler depois.",
  "💡 No VS Code, Alt + ↑/↓ move a linha inteira pra cima ou pra baixo.",
  "💡 Ctrl + P abre o buscador de arquivos no VS Code.",
  "💡 Funções pequenas e com nome bom valem mais que comentários longos.",
  "💡 Sempre teste com casos extremos: vazio, zero, número grande.",
  "💡 Git commit pequeno e frequente salva sua vida no futuro.",
  "💡 Em JavaScript, === compara valor E tipo. Prefira ele a ==.",
  "💡 Use const por padrão; só use let quando precisar mudar o valor.",
  "💡 Pausa de 5 minutos a cada 25 ajuda o cérebro a fixar conceitos.",
  "💡 Leia o erro até o fim — geralmente ele diz exatamente o que falta.",
  "💡 No terminal, ↑ traz o último comando que você digitou.",
];

export const randomFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------------------
// Cache local do companheiro — POR USUÁRIO.
// Antes a chave era global ("codey_companion_index"): em um computador
// compartilhado (criança + responsável/professor), o companheiro de uma conta
// aparecia na outra até a resposta do servidor chegar.
// ---------------------------------------------------------------------------
const LEGACY_CACHE_KEY = "codey_companion_index";
const cacheKey = (userId: string) => `codey_companion:v2:${userId}`;

export const isCompanionCacheKey = (key: string | null, userId: string) => key === cacheKey(userId);

export const readCachedCompanionIndex = (userId: string | null | undefined): number | null => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (raw == null) return null;
    const n = Number(raw);
    return isValidCompanionIndex(n) ? n : null;
  } catch {
    return null;
  }
};

export const writeCachedCompanionIndex = (userId: string, index: number | null) => {
  try {
    if (index == null) localStorage.removeItem(cacheKey(userId));
    else localStorage.setItem(cacheKey(userId), String(index));
  } catch {
    /* modo privado / storage cheio: segue só com o estado em memória */
  }
};

export const dropLegacyCompanionCache = () => {
  try {
    localStorage.removeItem(LEGACY_CACHE_KEY);
  } catch {
    /* ignore */
  }
};

/** Baixa e decodifica a imagem antes de ela aparecer, evitando o "pisca". */
export const preloadImage = (src: string) => {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  img.decode?.().catch(() => undefined);
};
