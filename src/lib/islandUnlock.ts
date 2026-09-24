// Liberação progressiva: cada ilha destrava quando a anterior é concluída.
// Ilha 1 sempre aberta. Ilha N (N>1) abre quando todas as lições da ilha N-1
// tiverem pelo menos uma tentativa concluída pelo aluno.

import { lessonsForIsland } from "@/data/codeyContent";
import { lessonKey } from "@/lib/progress";

// Correção: o progresso é salvo como "island-X-lesson-Y"; antes comparava com o id cru.
export const isIslandComplete = (islandId: number, completedLessons: Set<string>) => {
  const lessons = lessonsForIsland(islandId);
  if (lessons.length === 0) return false;
  return lessons.every((l) => completedLessons.has(lessonKey(islandId, l.id)));
};

// Todas as ilhas estão liberadas para qualquer aluno.
export const isIslandUnlocked = (_islandId: number, _completedLessons?: Set<string>) => true;

export const unlockReason = (_islandId: number) => null;
