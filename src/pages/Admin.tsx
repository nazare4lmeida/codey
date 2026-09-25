import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useAuth, friendlyAuthError } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, Users, BookOpen, Trophy, Trash2, Pencil, Plus, Loader2, LogOut, Home, KeyRound,
  Search, Sparkles, TrendingUp, Activity, Flame, Star, MapPin, Award, Crown, Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import PasswordInput from "@/components/PasswordInput";
import AuroraBackground from "@/components/AuroraBackground";
import { adminCompanion } from "@/lib/companions";
import AnimatedCompanion from "@/components/AnimatedCompanion";
import { codeyIslands, codeyLessons } from "@/data/codeyContent";

type AdminUser = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  user_metadata?: { display_name?: string };
};

/**
 * Operações de usuários do painel.
 * Antes dependiam da Edge Function "admin-users" (que precisava ser publicada à parte no Supabase).
 * Agora usam funções SQL (supabase/migrations/20260925120000_admin_sem_edge_function.sql), que já
 * conferem se quem chama é admin. Criar conta usa o cadastro oficial do Supabase.
 */
type Rpc = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
const rpc = async (fn: string, args: Record<string, unknown> = {}) => {
  const { data, error } = await (supabase.rpc as unknown as Rpc)(fn, args);
  if (error) throw new Error(error.message);
  return data;
};

// Cliente descartável só para criar contas: não guarda sessão, então quem é admin continua logada.
const signupClient = () =>
  createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "codey-admin-signup" },
  });

type ListedUser = { id: string; email: string; created_at: string; last_sign_in_at: string | null; display_name: string };

const invoke = async (action: string, payload: Record<string, unknown> = {}) => {
  switch (action) {
    case "list": {
      const rows = ((await rpc("admin_list_users")) as ListedUser[]) ?? [];
      const users: AdminUser[] = rows.map((r) => ({
        id: r.id,
        email: r.email,
        created_at: r.created_at,
        last_sign_in_at: r.last_sign_in_at,
        user_metadata: { display_name: r.display_name },
      }));
      return { users };
    }
    case "update":
      await rpc("admin_update_user", {
        _user_id: payload.userId,
        _display_name: payload.display_name ?? null,
        _email: payload.email ?? null,
        _password: payload.password ?? null,
      });
      return { ok: true };
    case "delete":
      await rpc("admin_delete_user", { _user_id: payload.userId });
      return { ok: true };
    case "set_role":
      await rpc("admin_set_role", { _user_id: payload.userId, _role: payload.role, _enabled: !!payload.enabled });
      return { ok: true };
    case "create": {
      const { data, error } = await signupClient().auth.signUp({
        email: String(payload.email),
        password: String(payload.password),
        options: { data: { display_name: String(payload.display_name ?? "") } },
      });
      if (error) throw new Error(friendlyAuthError(error.message));
      // Com a confirmação de e-mail ligada, o Supabase não diz se o e-mail já existia: devolve um usuário sem login.
      if (!data.user || data.user.identities?.length === 0) throw new Error("Esse e-mail já tem conta.");
      return { user: data.user, needsConfirmation: !data.session };
    }
    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }
};

const Admin = () => {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [noAdminYet, setNoAdminYet] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (data) { setIsAdmin(true); setChecking(false); return; }
      const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
      setNoAdminYet((count ?? 0) === 0);
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  const claimAdmin = async () => {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error || !data) { toast.error("Não foi possível reivindicar admin."); return; }
    toast.success("Você agora é administrador!");
    setIsAdmin(true);
  };

  if (authLoading || checking) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <AuroraBackground variant="lavender" />
        <ThemeToggle />
        <Card className="max-w-md w-full p-8 text-center space-y-4 relative z-10 backdrop-blur-sm bg-card/80">
          <Shield className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-2xl font-display font-bold">Área restrita</h1>
          {noAdminYet ? (
            <>
              <p className="text-muted-foreground text-sm">Nenhum administrador cadastrado ainda. Você pode se tornar o primeiro admin do sistema.</p>
              <Button variant="hero" onClick={claimAdmin} className="w-full"><Shield className="w-4 h-4" /> Tornar-me administrador</Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Você não tem permissão para acessar este painel.</p>
          )}
          <Button variant="ghost" onClick={() => navigate("/hub")} className="w-full"><Home className="w-4 h-4" /> Voltar ao Hub</Button>
        </Card>
      </div>
    );
  }

  return <AdminPanel adminName={user?.name || user?.email?.split("@")[0] || "Admin"} onLogout={async () => { await logout(); navigate("/"); }} />;
};

/* -------- Companion greetings for admin -------- */
const lilyGreetings = [
  "Tudo florescendo por aqui, admin ✿",
  "As raízes do Codey estão fortes hoje!",
  "Já regamos as ilhas — está tudo em ordem.",
  "Seus jardineiros aprendizes estão animados hoje 🌸",
  "Prontas as sementes de novos desafios?",
];

/* -------- Main Panel -------- */
const AdminPanel = ({ adminName, onLogout }: { adminName: string; onLogout: () => void }) => {
  const navigate = useNavigate();
  const greeting = useMemo(() => lilyGreetings[Math.floor(Math.random() * lilyGreetings.length)], []);

  return (
    <div className="min-h-screen bg-background relative">
      <AuroraBackground variant="lavender" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card/70 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-6 h-6 text-primary flex-shrink-0" />
          <h1 className="font-display font-bold text-base sm:text-lg truncate">Painel Admin · Codey</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate("/hub")}>
            <Home className="w-4 h-4" /> <span className="hidden sm:inline">Hub</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
          </Button>
          <ThemeToggle inline />
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* HERO com companheira Lily */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden p-5 sm:p-6 border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative flex-shrink-0" title="Toque na Lily ✿">
                <div className="absolute inset-0 bg-secondary/40 blur-2xl rounded-full" />
                <AnimatedCompanion
                  companion={adminCompanion}
                  clickClips={["pensando", "assustada", "tonto"]}
                  alt="Lily, sua companheira admin"
                  className="relative w-32 h-32 sm:w-40 sm:h-40 drop-shadow-lg"
                />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Companheira admin</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold">
                  Olá, <span className="text-primary">{adminName}</span> — Lily te acompanha ✿
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base italic">"{greeting}"</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Overview cards sempre visíveis */}
        <OverviewCards />

        <Tabs defaultValue="stats">
          <TabsList className="mb-4 flex-wrap h-auto bg-card/60 backdrop-blur-sm">
            <TabsTrigger value="stats"><TrendingUp className="w-4 h-4 mr-1" /> Visão geral</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Usuários</TabsTrigger>
            <TabsTrigger value="attempts"><BookOpen className="w-4 h-4 mr-1" /> Tentativas</TabsTrigger>
            <TabsTrigger value="content"><MapPin className="w-4 h-4 mr-1" /> Conteúdo</TabsTrigger>
          </TabsList>
          <TabsContent value="stats"><StatsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="attempts"><AttemptsTab /></TabsContent>
          <TabsContent value="content"><ContentTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

/* -------- Overview cards (KPIs no topo) -------- */
const OverviewCards = () => {
  const [kpi, setKpi] = useState<{ users: number; attempts: number; today: number; badges: number } | null>(null);

  useEffect(() => {
    (async () => {
      const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
      const [u, a, t, b] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("lesson_attempts").select("id", { count: "exact", head: true }),
        supabase.from("lesson_attempts").select("id", { count: "exact", head: true }).gte("created_at", startToday.toISOString()),
        supabase.from("user_badges").select("id", { count: "exact", head: true }),
      ]);
      setKpi({ users: u.count ?? 0, attempts: a.count ?? 0, today: t.count ?? 0, badges: b.count ?? 0 });
    })();
  }, []);

  const items = [
    { label: "Aprendizes", value: kpi?.users, icon: Users, tone: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { label: "Tentativas totais", value: kpi?.attempts, icon: BookOpen, tone: "from-secondary/25 to-secondary/5", iconColor: "text-secondary-foreground" },
    { label: "Atividade hoje", value: kpi?.today, icon: Activity, tone: "from-accent/25 to-accent/5", iconColor: "text-accent-foreground" },
    { label: "Medalhas concedidas", value: kpi?.badges, icon: Award, tone: "from-primary/15 to-secondary/10", iconColor: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((i, idx) => (
        <motion.div
          key={i.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * idx, duration: 0.35 }}
        >
          <Card className={`p-4 h-full bg-gradient-to-br ${i.tone} border-border/60`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-background/70 flex items-center justify-center ${i.iconColor}`}>
                <i.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground truncate">{i.label}</div>
                <div className="text-2xl font-display font-bold">
                  {kpi ? i.value : <Loader2 className="w-4 h-4 animate-spin inline" />}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

/* -------- Users tab -------- */
const UsersTab = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke("list", { perPage: 200 }) as { users: AdminUser[] };
      setUsers(data.users);
      const { data: roleRows } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
      setAdmins(new Set((roleRows ?? []).map(r => r.user_id)));
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.user_metadata?.display_name ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const remove = async (u: AdminUser) => {
    if (!confirm(`Excluir ${u.email}? Esta ação é permanente.`)) return;
    try { await invoke("delete", { userId: u.id }); toast.success("Usuário removido."); load(); }
    catch (e) { toast.error((e as Error).message); }
  };

  const toggleAdmin = async (u: AdminUser) => {
    const isA = admins.has(u.id);
    try {
      await invoke("set_role", { userId: u.id, role: "admin", enabled: !isA });
      toast.success(!isA ? "Promovido a admin" : "Admin removido");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="font-display font-bold">Usuários ({filtered.length}/{users.length})</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nome ou email..."
              className="pl-8 h-9 w-56"
            />
          </div>
          <Button size="sm" variant="hero" onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> Novo</Button>
        </div>
      </div>
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="py-2 pr-2">Nome</th><th className="pr-2">Email</th><th className="pr-2">Criado</th><th className="pr-2">Último login</th><th className="pr-2">Admin</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-2 font-medium">{u.user_metadata?.display_name || "—"}</td>
                  <td className="pr-2">{u.email}</td>
                  <td className="pr-2 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  <td className="pr-2 text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</td>
                  <td className="pr-2">
                    <button onClick={() => toggleAdmin(u)} className={`text-xs px-2 py-1 rounded-full transition ${admins.has(u.id) ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {admins.has(u.id) ? "Sim" : "Não"}
                    </button>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(u)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(u)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground text-sm">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {creating && <CreateUserDialog onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </Card>
  );
};

const EditUserDialog = ({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) => {
  const [email, setEmail] = useState(user.email ?? "");
  const [displayName, setDisplayName] = useState(user.user_metadata?.display_name ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await invoke("update", { userId: user.id, email: email !== user.email ? email : undefined, display_name: displayName, password: password || undefined });
      toast.success("Usuário atualizado.");
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label className="flex items-center gap-1"><KeyRound className="w-3 h-3" /> Nova senha (opcional)</Label><PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe em branco para manter" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="hero" onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CreateUserDialog = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!email || password.length < 6) { toast.error("Email e senha (6+) obrigatórios."); return; }
    setSaving(true);
    try {
      const res = (await invoke("create", { email, password, display_name: displayName })) as { needsConfirmation?: boolean };
      if (res.needsConfirmation) toast.info("Conta criada. Ela só entra depois de confirmar o e-mail (a confirmação ainda está ligada no Supabase).", { duration: 8000 });
      else toast.success("Usuário criado.");
      onCreated();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Senha</Label><PasswordInput value={password} onChange={e => setPassword(e.target.value)} minLength={6} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="hero" onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* -------- Attempts tab -------- */
type Attempt = { id: string; user_id: string; island_id: string; lesson_id: string; score: number; stars: number; correct_count: number; total: number; completed: boolean; created_at: string };
const AttemptsTab = () => {
  const [rows, setRows] = useState<Attempt[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("lesson_attempts").select("*").order("created_at", { ascending: false }).limit(200);
      setRows((data ?? []) as Attempt[]);
      const ids = Array.from(new Set((data ?? []).map(r => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
        const map: Record<string, string> = {};
        (profs ?? []).forEach(p => { map[p.user_id] = p.display_name ?? ""; });
        setNames(map);
      }
      setLoading(false);
    })();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta tentativa?")) return;
    const { error } = await supabase.from("lesson_attempts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows(r => r.filter(x => x.id !== id));
    toast.success("Removida.");
  };

  return (
    <Card className="p-4">
      <h2 className="font-display font-bold mb-3">Últimas tentativas ({rows.length})</h2>
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="py-2 pr-2">Usuário</th><th className="pr-2">Ilha / Lição</th><th className="pr-2">Score</th><th className="pr-2">Acertos</th><th className="pr-2">⭐</th><th className="pr-2">Quando</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 pr-2">{names[r.user_id] || <span className="text-muted-foreground italic" title={r.user_id}>Sem nome ({r.user_id.slice(0, 6)})</span>}</td>
                  <td className="pr-2 text-muted-foreground">{r.island_id} / {r.lesson_id}</td>
                  <td className="pr-2 font-medium">{r.score}</td>
                  <td className="pr-2">{r.correct_count}/{r.total}</td>
                  <td className="pr-2">{"⭐".repeat(r.stars)}</td>
                  <td className="pr-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="text-right"><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

/* -------- Stats tab (rich) -------- */
const StatsTab = () => {
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<{ user_id: string; display_name: string; weekly_points: number }[]>([]);
  const [recent, setRecent] = useState<{ id: string; display_name: string; created_at: string }[]>([]);
  const [activity, setActivity] = useState<{ label: string; count: number }[]>([]);
  const [popular, setPopular] = useState<{ island_id: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      // Weekly leaderboard
      const { data: lb } = await supabase.rpc("weekly_leaderboard", { _limit: 5 });
      setWeekly((lb ?? []) as typeof weekly);

      // Recent signups
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      setRecent((prof ?? []) as typeof recent);

      // Activity last 7 days
      const since = new Date(); since.setDate(since.getDate() - 6); since.setHours(0,0,0,0);
      const { data: att } = await supabase
        .from("lesson_attempts")
        .select("created_at, island_id")
        .gte("created_at", since.toISOString());
      const days: Record<string, number> = {};
      const islandCount: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0,10)] = 0;
      }
      (att ?? []).forEach((r) => {
        const k = new Date(r.created_at as string).toISOString().slice(0,10);
        if (k in days) days[k] += 1;
        islandCount[r.island_id as string] = (islandCount[r.island_id as string] || 0) + 1;
      });
      const dayLabels = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
      setActivity(Object.keys(days).map(k => ({ label: dayLabels[new Date(k).getDay()], count: days[k] })));
      setPopular(
        Object.entries(islandCount).map(([island_id, count]) => ({ island_id, count }))
          .sort((a,b) => b.count - a.count).slice(0, 5)
      );

      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader2 className="w-5 h-5 animate-spin" />;
  const maxAct = Math.max(1, ...activity.map(a => a.count));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Activity chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold">Atividade — últimos 7 dias</h3>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {activity.map((a, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground font-medium">{a.count}</div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(a.count / maxAct) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                className="w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-secondary/60 min-h-[4px]"
              />
              <div className="text-xs text-muted-foreground">{a.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly leaderboard */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold">Top da semana</h3>
        </div>
        {weekly.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém pontuou nesta semana ainda.</p>
        ) : (
          <ul className="space-y-2">
            {weekly.map((w, i) => (
              <li key={w.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-accent text-accent-foreground" : i === 1 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <span className="font-medium truncate">{w.display_name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="w-3 h-3 text-accent" />
                  <span className="font-bold">{w.weekly_points}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Recent signups */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold">Novos aprendizes</h3>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem cadastros recentes.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map(r => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.display_name || "Aprendiz sem nome"}</span>
                <span className="text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Popular islands */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold">Ilhas mais visitadas (7d)</h3>
        </div>
        {popular.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem tentativas recentes.</p>
        ) : (
          <ul className="space-y-2">
            {popular.map(p => {
              const island = codeyIslands.find(i => String(i.id) === String(p.island_id));
              const max = popular[0].count;
              return (
                <li key={p.island_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate">{island?.name || p.island_id}</span>
                    <span className="text-muted-foreground">{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary/70 to-accent/70 rounded-full" style={{ width: `${(p.count/max)*100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

/* -------- Content tab (visão do currículo) -------- */
const ContentTab = () => {
  const lessonCount = (id: number) => (codeyLessons[id] || []).length;
  const totalLessons = codeyIslands.reduce((s, i) => s + lessonCount(i.id), 0);
  const totalExercises = codeyIslands.reduce(
    (s, i) => s + (codeyLessons[i.id] || []).reduce((ls, l) => ls + l.exercises.length, 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="text-xs text-muted-foreground">Ilhas</div>
          <div className="text-2xl font-display font-bold">{codeyIslands.length}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-secondary/15 to-transparent">
          <div className="text-xs text-muted-foreground">Lições</div>
          <div className="text-2xl font-display font-bold">{totalLessons}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/15 to-transparent">
          <div className="text-xs text-muted-foreground">Exercícios</div>
          <div className="text-2xl font-display font-bold">{totalExercises}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-display font-bold mb-3">Trilha completa</h3>
        <div className="space-y-2">
          {codeyIslands.map((i, idx) => (
            <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{i.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.weeksLabel} · {i.focus}</div>
                </div>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                {lessonCount(i.id)} lições
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Admin;
