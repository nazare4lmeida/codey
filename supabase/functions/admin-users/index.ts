import { createClient } from "npm:@supabase/supabase-js@2";

// Permissões de acesso (CORS) definidas aqui mesmo: a função não depende de nenhum
// caminho especial de pacote para iniciar. Se ela falha ao iniciar, o navegador só
// mostra "Failed to send a request to the Edge Function".
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userRes, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userRes.user) {
      return json({ error: "unauthorized" }, 401);
    }
    const admin = createClient(url, service);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userRes.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "list") {
      const page = Number(body.page ?? 1);
      const perPage = Number(body.perPage ?? 100);
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) return json({ error: error.message }, 400);
      return json({ users: data.users });
    }

    if (action === "update") {
      const { userId, email, password, display_name } = body;
      if (!userId) return json({ error: "userId required" }, 400);
      const attrs: Record<string, unknown> = {};
      if (email) attrs.email = email;
      if (password) attrs.password = password;
      if (display_name !== undefined) attrs.user_metadata = { display_name };
      const { data, error } = await admin.auth.admin.updateUserById(userId, attrs);
      if (error) return json({ error: error.message }, 400);
      if (display_name !== undefined) {
        await admin.from("profiles").update({ display_name }).eq("user_id", userId);
      }
      return json({ user: data.user });
    }

    if (action === "delete") {
      const { userId } = body;
      if (!userId) return json({ error: "userId required" }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "create") {
      const { email, password, display_name } = body;
      if (!email || !password) return json({ error: "email/password required" }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { display_name: display_name ?? "" },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: data.user });
    }

    if (action === "set_role") {
      const { userId, role, enabled } = body;
      if (!userId || !role) return json({ error: "userId/role required" }, 400);
      if (enabled) {
        const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
        if (error && !error.message.includes("duplicate")) return json({ error: error.message }, 400);
      } else {
        await admin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      }
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
