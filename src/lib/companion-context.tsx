import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  dropLegacyCompanionCache,
  getCompanion,
  isCompanionCacheKey,
  isValidCompanionIndex,
  preloadImage,
  readCachedCompanionIndex,
  writeCachedCompanionIndex,
  type Companion,
} from "@/lib/companions";

/**
 * Fonte ÚNICA de verdade do companheiro do usuário logado.
 *
 * Problemas que isto resolve (antes cada página buscava sozinha):
 * - Perfil começava mostrando o mascote Codey e só depois trocava ("personagem errado").
 * - Cache global entre contas → companheiro de outra pessoa aparecia.
 * - Erro de rede era tratado como "sem personagem": WorldHub mandava para o
 *   criador e, se a criança clicasse em "Entrar no mapa", a escolha dela era
 *   sobrescrita pela Vix (índice 0).
 * - Respostas antigas (de outra conta / outra navegação) podiam chegar depois
 *   e sobrescrever a certa.
 */

type Status = "loading" | "ready" | "error";

type State = {
  userId: string | null;
  index: number | null;
  /** true = tem personagem salvo; false = confirmado que não tem; null = ainda não sabemos */
  hasCharacter: boolean | null;
  status: Status;
};

type CompanionContextValue = {
  companion: Companion;
  companionIndex: number | null;
  hasCharacter: boolean | null;
  status: Status;
  /** Já temos algo confiável para exibir (cache do próprio usuário ou resposta do servidor). */
  isResolved: boolean;
  setCompanionIndex: (index: number) => void;
  refresh: () => void;
};

const CompanionContext = createContext<CompanionContextValue | null>(null);

const stateFromCache = (userId: string | null): State => {
  const cached = readCachedCompanionIndex(userId);
  return {
    userId,
    index: cached,
    hasCharacter: cached != null ? true : null,
    status: userId ? "loading" : "ready",
  };
};

dropLegacyCompanionCache();

export const CompanionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<State>(() => stateFromCache(userId));
  const [reloadToken, setReloadToken] = useState(0);

  // Troca de conta: ajusta o estado DURANTE o render (não num effect), para que
  // nem um único frame mostre o companheiro da conta anterior.
  const current = state.userId === userId ? state : stateFromCache(userId);
  if (state.userId !== userId) setState(current);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("characters")
      .select("accessory")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return; // resposta atrasada de outra conta/efeito: descarta
        if (error) {
          // Mantém o que temos em cache. NÃO conclui que "não tem personagem".
          setState((s) => (s.userId === userId ? { ...s, status: "error" } : s));
          return;
        }
        const index = data && isValidCompanionIndex(data.accessory) ? data.accessory : null;
        writeCachedCompanionIndex(userId, index);
        setState({ userId, index, hasCharacter: !!data, status: "ready" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  // Sincroniza entre abas abertas do mesmo navegador.
  useEffect(() => {
    if (!userId) return;
    const onStorage = (e: StorageEvent) => {
      if (!isCompanionCacheKey(e.key, userId)) return;
      const index = readCachedCompanionIndex(userId);
      setState((s) => (s.userId === userId ? { ...s, index, hasCharacter: index != null ? true : s.hasCharacter } : s));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  const companion = getCompanion(current.index);

  useEffect(() => {
    preloadImage(companion.img);
  }, [companion.img]);

  const setCompanionIndex = useCallback(
    (index: number) => {
      if (!userId || !isValidCompanionIndex(index)) return;
      writeCachedCompanionIndex(userId, index);
      setState({ userId, index, hasCharacter: true, status: "ready" });
    },
    [userId],
  );

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  const value = useMemo<CompanionContextValue>(
    () => ({
      companion,
      companionIndex: current.index,
      hasCharacter: current.hasCharacter,
      status: current.status,
      isResolved: current.status !== "loading" || current.index != null,
      setCompanionIndex,
      refresh,
    }),
    [companion, current.index, current.hasCharacter, current.status, setCompanionIndex, refresh],
  );

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
};

export const useCompanion = () => {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error("useCompanion must be used within CompanionProvider");
  return ctx;
};
