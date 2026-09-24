import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidAura, isValidSupport } from "@/lib/character-prefs";
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
  /** aura (characters.outfit_color) e estilo de apoio (characters.ability) */
  aura: number;
  support: number | null;
};

type Prefs = { aura: number; support: number | null };
const prefsKey = (userId: string) => `codey_prefs:v1:${userId}`;
const readPrefs = (userId: string | null): Prefs => {
  const fallback: Prefs = { aura: 0, support: null };
  if (!userId) return fallback;
  try {
    const p = JSON.parse(localStorage.getItem(prefsKey(userId)) ?? "null");
    return { aura: isValidAura(p?.aura) ? p.aura : 0, support: isValidSupport(p?.support) ? p.support : null };
  } catch {
    return fallback;
  }
};
const writePrefs = (userId: string, prefs: Prefs) => {
  try {
    localStorage.setItem(prefsKey(userId), JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
};

type CompanionContextValue = {
  companion: Companion;
  companionIndex: number | null;
  hasCharacter: boolean | null;
  status: Status;
  /** Já temos algo confiável para exibir (cache do próprio usuário ou resposta do servidor). */
  isResolved: boolean;
  /** índice da aura escolhida (ver AURAS) */
  aura: number;
  /** estilo de apoio escolhido (ver SUPPORT_STYLES); null = não escolheu */
  support: number | null;
  setCompanionIndex: (index: number) => void;
  /** chamado pelo criador de personagem depois de salvar */
  setCharacterPrefs: (prefs: { aura: number; support: number }) => void;
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
    ...readPrefs(userId),
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
      .select("accessory, outfit_color, ability")
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
        const prefs: Prefs = {
          aura: data && isValidAura(data.outfit_color) ? data.outfit_color : 0,
          support: data && isValidSupport(data.ability) ? data.ability : null,
        };
        writePrefs(userId, prefs);
        setState({ userId, index, hasCharacter: !!data, status: "ready", ...prefs });
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
      setState((s) => ({ ...s, userId, index, hasCharacter: true, status: "ready" }));
    },
    [userId],
  );

  const setCharacterPrefs = useCallback(
    (prefs: { aura: number; support: number }) => {
      if (!userId) return;
      const clean: Prefs = { aura: isValidAura(prefs.aura) ? prefs.aura : 0, support: isValidSupport(prefs.support) ? prefs.support : null };
      writePrefs(userId, clean);
      setState((s) => (s.userId === userId ? { ...s, ...clean } : s));
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
      aura: current.aura,
      support: current.support,
      setCompanionIndex,
      setCharacterPrefs,
      refresh,
    }),
    [companion, current.index, current.hasCharacter, current.status, current.aura, current.support, setCompanionIndex, setCharacterPrefs, refresh],
  );

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
};

export const useCompanion = () => {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error("useCompanion must be used within CompanionProvider");
  return ctx;
};
