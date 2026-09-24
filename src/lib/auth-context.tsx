import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  name: string;
}

/** Mensagens do Supabase Auth traduzidas e explicadas (as originais vêm em inglês técnico). */
export const friendlyAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes("rate limit")) return "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Falta confirmar o e-mail. Abra a mensagem que enviamos e clique no link.";
  if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("invalid") && m.includes("email")) return "Esse e-mail não parece válido. Confira se digitou certinho.";
  return message;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  /** needsConfirmation: o Supabase exige confirmar o e-mail antes de entrar (sem sessão ainda) */
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const mapUser = (su: SupaUser): User => ({
  id: su.id,
  email: su.email || "",
  name: su.user_metadata?.display_name || su.email?.split("@")[0] || "Programador",
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mantém a MESMA referência de usuário enquanto id/nome/email não mudam.
    // Antes, cada evento do Supabase (TOKEN_REFRESHED a cada ~1h, foco na aba,
    // getSession + onAuthStateChange no boot) criava um objeto novo, e todo
    // efeito com [user] rodava de novo: buscas duplicadas e o companheiro
    // "piscando" no meio da lição.
    const apply = (su: SupaUser | null | undefined) => {
      setUser((prev) => {
        if (!su) return null;
        const next = mapUser(su);
        if (prev && prev.id === next.id && prev.name === next.name && prev.email === next.email) return prev;
        return next;
      });
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      apply(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: friendlyAuthError(error.message) };
    return { ok: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { ok: false, error: friendlyAuthError(error.message) };
    // Com "Confirm email" DESLIGADO no Supabase, já vem uma sessão e a criança entra direto.
    // Ligado, não há sessão até clicar no link do e-mail.
    return { ok: true, needsConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, login, signup, logout }), [user, isLoading, login, signup, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
