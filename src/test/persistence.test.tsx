import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

/**
 * Testes dos cenários que causavam "personagem errado" e perda de progresso.
 * O Supabase e a autenticação são simulados: cada teste controla o que o
 * "servidor" responde (dado, vazio ou erro de rede).
 */

// ---------- mocks ----------
type Resp = { data: unknown; error: unknown };
const server = {
  characters: new Map<string, Resp | Promise<Resp>>(),
  progressRows: [] as { world_id: string }[],
  upsertFails: false,
  upserts: [] as string[],
};

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => {
    const filters: Record<string, unknown> = {};
    const q = {
      select: () => q,
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return q;
      },
      maybeSingle: () => {
        const r = server.characters.get(filters.user_id as string);
        return Promise.resolve(r ?? { data: null, error: null });
      },
      then: (res: (r: Resp) => void) => res({ data: server.progressRows, error: null }),
      upsert: (row: { world_id: string }) => {
        if (server.upsertFails) return Promise.resolve({ error: { message: "offline" } });
        server.upserts.push(row.world_id);
        return Promise.resolve({ error: null });
      },
    };
    void table;
    return q;
  };
  return { supabase: { from } };
});

let currentUser: { id: string; name: string; email: string } | null = null;
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: currentUser, isLoading: false }),
}));

import { CompanionProvider, useCompanion } from "@/lib/companion-context";
import { companionList } from "@/lib/companions";
import { loadLocalCompleted, markLessonComplete, flushPendingProgress, syncCompleted } from "@/lib/progress";
import { isIslandComplete } from "@/lib/islandUnlock";
import { lessonsForIsland } from "@/data/codeyContent";

const Probe = () => {
  const { companion, hasCharacter, status, isResolved } = useCompanion();
  return (
    <div>
      <span data-testid="name">{isResolved ? companion.name : "(carregando)"}</span>
      <span data-testid="has">{String(hasCharacter)}</span>
      <span data-testid="status">{status}</span>
    </div>
  );
};

const user = (id: string) => ({ id, name: id, email: `${id}@x` });

beforeEach(() => {
  localStorage.clear();
  server.characters.clear();
  server.progressRows = [];
  server.upsertFails = false;
  server.upserts = [];
  currentUser = null;
});

describe("companheiro", () => {
  it("não mostra o mascote Codey enquanto carrega (placeholder neutro)", async () => {
    let release!: (r: Resp) => void;
    server.characters.set("ana", new Promise<Resp>((r) => (release = r)));
    currentUser = user("ana");
    render(<CompanionProvider><Probe /></CompanionProvider>);
    expect(screen.getByTestId("name").textContent).toBe("(carregando)");
    await act(async () => release({ data: { accessory: 5 }, error: null }));
    expect(screen.getByTestId("name").textContent).toBe("Astro");
  });

  it("usa o cache DO PRÓPRIO usuário na hora, sem esperar o servidor", async () => {
    localStorage.setItem("codey_companion:v2:ana", "2");
    server.characters.set("ana", new Promise(() => {})); // servidor nunca responde
    currentUser = user("ana");
    render(<CompanionProvider><Probe /></CompanionProvider>);
    expect(screen.getByTestId("name").textContent).toBe(companionList[2].name);
  });

  it("trocar de conta nunca exibe o companheiro da conta anterior", async () => {
    localStorage.setItem("codey_companion:v2:ana", "5"); // Ana = Astro
    server.characters.set("ana", { data: { accessory: 5 }, error: null });
    server.characters.set("bia", new Promise(() => {})); // Bia ainda carregando
    currentUser = user("ana");
    const { rerender } = render(<CompanionProvider><Probe /></CompanionProvider>);
    expect(screen.getByTestId("name").textContent).toBe("Astro");
    currentUser = user("bia");
    rerender(<CompanionProvider><Probe /></CompanionProvider>);
    expect(screen.getByTestId("name").textContent).toBe("(carregando)");
  });

  it("cache global antigo (vazava entre contas) é descartado", () => {
    // o módulo remove a chave legada ao ser importado; aqui garantimos que não é lida
    localStorage.setItem("codey_companion_index", "4");
    currentUser = user("nova");
    server.characters.set("nova", new Promise(() => {}));
    render(<CompanionProvider><Probe /></CompanionProvider>);
    expect(screen.getByTestId("name").textContent).toBe("(carregando)");
  });

  it("erro de rede NÃO é tratado como 'sem personagem' e mantém o cache", async () => {
    localStorage.setItem("codey_companion:v2:ana", "3");
    server.characters.set("ana", { data: null, error: { message: "Failed to fetch" } });
    currentUser = user("ana");
    render(<CompanionProvider><Probe /></CompanionProvider>);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("error"));
    expect(screen.getByTestId("has").textContent).not.toBe("false"); // não redireciona ao criador
    expect(screen.getByTestId("name").textContent).toBe("Musgo");
    expect(localStorage.getItem("codey_companion:v2:ana")).toBe("3");
  });

  it("só confirma 'sem personagem' quando o servidor responde sem linha", async () => {
    currentUser = user("novo");
    render(<CompanionProvider><Probe /></CompanionProvider>);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("ready"));
    expect(screen.getByTestId("has").textContent).toBe("false");
  });

  it("resposta do servidor atualiza um cache desatualizado", async () => {
    localStorage.setItem("codey_companion:v2:ana", "0");
    server.characters.set("ana", { data: { accessory: 1 }, error: null });
    currentUser = user("ana");
    render(<CompanionProvider><Probe /></CompanionProvider>);
    await waitFor(() => expect(screen.getByTestId("name").textContent).toBe("Brasa"));
    expect(localStorage.getItem("codey_companion:v2:ana")).toBe("1");
  });
});

describe("progresso", () => {
  it("se o servidor falhar, a lição fica pendente e sobe quando a conexão volta", async () => {
    server.upsertFails = true;
    await markLessonComplete("ana", "island-1-lesson-1-1", 20);
    expect(loadLocalCompleted("ana").has("island-1-lesson-1-1")).toBe(true);
    expect(server.upserts).toEqual([]);
    server.upsertFails = false;
    await flushPendingProgress("ana");
    expect(server.upserts).toEqual(["island-1-lesson-1-1"]);
    await flushPendingProgress("ana"); // fila esvaziada: não reenvia
    expect(server.upserts).toEqual(["island-1-lesson-1-1"]);
  });

  it("recupera conclusões antigas que ficaram só no navegador", async () => {
    localStorage.setItem("codey_completed_lessons:ana", JSON.stringify(["island-1-lesson-1-1"]));
    server.progressRows = [{ world_id: "island-2-lesson-2-1" }];
    const merged = await syncCompleted("ana");
    expect([...merged].sort()).toEqual(["island-1-lesson-1-1", "island-2-lesson-2-1"]);
    await waitFor(() => expect(server.upserts).toContain("island-1-lesson-1-1"));
  });

  it("isIslandComplete reconhece o formato salvo (island-X-lesson-Y)", () => {
    const keys = new Set(lessonsForIsland(1).map((l) => `island-1-lesson-${l.id}`));
    expect(isIslandComplete(1, keys)).toBe(true);
    expect(isIslandComplete(1, new Set())).toBe(false);
  });
});

describe("som", () => {
  it("mudo é persistido e religar com volume 0 volta a um volume audível", async () => {
    const { soundStore } = await import("@/lib/sound");
    soundStore.setVolume(0);
    expect(soundStore.get().muted).toBe(true);
    soundStore.toggleMuted();
    expect(soundStore.get()).toEqual({ muted: false, volume: 0.5 });
    soundStore.toggleMuted();
    expect(JSON.parse(localStorage.getItem("codey_sound_prefs")!).muted).toBe(true);
  });

  it("tocar som sem suporte a áudio não quebra o jogo", async () => {
    const { sfx, soundStore } = await import("@/lib/sound");
    soundStore.setMuted(false);
    expect(() => {
      sfx.correct();
      sfx.wrong();
      sfx.complete();
    }).not.toThrow();
  });
});
