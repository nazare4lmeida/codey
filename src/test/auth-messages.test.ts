import { describe, it, expect } from "vitest";
import { vi } from "vitest";
// o cliente do Supabase exige a URL do .env; aqui só testamos a tradução das mensagens
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {} } }));
import { friendlyAuthError } from "@/lib/auth-context";

describe("mensagens de erro do login", () => {
  it("traduz o limite de e-mails e outros erros comuns", () => {
    expect(friendlyAuthError("email rate limit exceeded")).toMatch(/Espere alguns minutos/);
    expect(friendlyAuthError("User already registered")).toMatch(/já tem conta/);
    expect(friendlyAuthError("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
    expect(friendlyAuthError("algo inesperado")).toBe("algo inesperado");
  });
});
