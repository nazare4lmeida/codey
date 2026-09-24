import { supabase } from "@/integrations/supabase/client";
import { findLesson } from "@/data/codeyContent";

/**
 * Progresso das lições: cache local por usuário + servidor (game_progress).
 *
 * Antes:
 * - A mesma lógica estava copiada em WorldHub e CodeyWorld (e só uma salvava o merge).
 * - Se o upsert falhasse (Wi-Fi caiu), a lição ficava concluída só naquele
 *   navegador e nunca subia para o servidor → em outro aparelho "sumia".
 * - isIslandComplete comparava com o id cru da lição, mas o que é salvo é
 *   "island-X-lesson-Y", então nunca dava verdadeiro.
 *
 * Agora toda conclusão entra numa fila local "pendente" até o servidor confirmar.
 */

export const lessonKey = (islandId: number, lessonId: string) => `island-${islandId}-lesson-${lessonId}`;

const doneKey = (userId: string) => `codey_completed_lessons:${userId}`;
const pendingKey = (userId: string) => `codey_pending_progress:${userId}`;

type Pending = Record<string, number>; // world_id -> stars_collected

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const loadLocalCompleted = (userId?: string | null): Set<string> => {
  if (!userId) return new Set();
  const arr = readJSON<unknown>(doneKey(userId), []);
  return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
};

const saveLocalCompleted = (userId: string, completed: Set<string>) => writeJSON(doneKey(userId), [...completed]);

const readPending = (userId: string) => readJSON<Pending>(pendingKey(userId), {});
const writePending = (userId: string, p: Pending) => writeJSON(pendingKey(userId), p);

const pushOne = async (userId: string, worldId: string, stars: number) => {
  const { error } = await supabase
    .from("game_progress")
    .upsert({ user_id: userId, world_id: worldId, completed: true, stars_collected: stars }, { onConflict: "user_id,world_id" });
  return !error;
};

/** Envia conclusões que ainda não chegaram ao servidor. */
export const flushPendingProgress = async (userId: string) => {
  const pending = readPending(userId);
  const entries = Object.entries(pending);
  if (entries.length === 0) return;
  const results = await Promise.all(entries.map(async ([id, stars]) => [id, await pushOne(userId, id, stars)] as const));
  const still = readPending(userId);
  results.forEach(([id, ok]) => {
    if (ok) delete still[id];
  });
  writePending(userId, still);
};

/** Marca uma lição como concluída: grava local na hora e tenta subir para o servidor. */
export const markLessonComplete = async (userId: string, worldId: string, stars: number): Promise<Set<string>> => {
  const completed = loadLocalCompleted(userId).add(worldId);
  saveLocalCompleted(userId, completed);
  writePending(userId, { ...readPending(userId), [worldId]: stars });
  await flushPendingProgress(userId);
  return completed;
};

/** Junta local + servidor, salva o resultado e reenvia pendências. */
export const syncCompleted = async (userId: string): Promise<Set<string>> => {
  const merged = loadLocalCompleted(userId);
  const { data, error } = await supabase.from("game_progress").select("world_id").eq("user_id", userId).eq("completed", true);
  if (!error && data) {
    const onServer = new Set(data.map((row) => row.world_id));
    // Recupera conclusões antigas que ficaram só neste navegador (falhas antes desta correção).
    const pending = readPending(userId);
    let changed = false;
    merged.forEach((id) => {
      if (onServer.has(id) || id in pending) return;
      const m = /^island-(\d+)-lesson-(.+)$/.exec(id);
      const lesson = m ? findLesson(Number(m[1]), m[2]) : null;
      if (!lesson) return;
      pending[id] = lesson.xp;
      changed = true;
    });
    if (changed) writePending(userId, pending);
    onServer.forEach((id) => merged.add(id));
    saveLocalCompleted(userId, merged);
  }
  void flushPendingProgress(userId);
  return merged;
};

// Ao voltar a internet, tenta de novo automaticamente.
export const retryPendingWhenOnline = (userId: string) => {
  const onOnline = () => void flushPendingProgress(userId);
  window.addEventListener("online", onOnline);
  return () => window.removeEventListener("online", onOnline);
};
