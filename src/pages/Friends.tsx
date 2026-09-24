import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Heart, Search, Send, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppHeader from "@/components/AppHeader";
import ParticleField from "@/components/ParticleField";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { grantBadge } from "@/lib/badges";

interface ProfileRow {
  user_id: string;
  display_name: string;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
}

const ENCOURAGEMENTS = [
  "Você está indo muito bem! 🌟",
  "Não desista, cada erro é aprendizado 💪",
  "Bora praticar mais um pouquinho hoje?",
  "Sua evolução me inspira! ✨",
];

const Friends = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [received, setReceived] = useState<{ id: string; message: string; from_user_id: string; created_at: string; sender: string }[]>([]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  const loadAll = async () => {
    if (!user) return;
    const { data: fs } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    setFriendships((fs as FriendshipRow[]) || []);

    const ids = new Set<string>();
    (fs || []).forEach((f: any) => {
      ids.add(f.requester_id);
      ids.add(f.addressee_id);
    });
    ids.delete(user.id);
    if (ids.size) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", [...ids]);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => (map[p.user_id] = p.display_name || "Programador"));
      setProfiles(map);
    }

    const { data: enc } = await supabase
      .from("encouragements")
      .select("id, message, from_user_id, created_at")
      .eq("to_user_id", user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false });
    if (enc && enc.length) {
      const senderIds = [...new Set(enc.map((e: any) => e.from_user_id))];
      const { data: sprofs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", senderIds);
      const smap: Record<string, string> = {};
      (sprofs || []).forEach((p: any) => (smap[p.user_id] = p.display_name || "Amigo"));
      setReceived(enc.map((e: any) => ({ ...e, sender: smap[e.from_user_id] || "Amigo" })));
    } else {
      setReceived([]);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const search = async () => {
    if (!user || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .ilike("display_name", `%${query.trim()}%`)
      .neq("user_id", user.id)
      .limit(10);
    setResults((data as ProfileRow[]) || []);
  };

  const sendRequest = async (addressee: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: addressee, status: "pending" });
    if (error) return toast.error("Não foi possível enviar (talvez já exista).");
    toast.success("Pedido enviado! 💌");
    loadAll();
  };

  const respond = async (id: string, status: "accepted" | "declined") => {
    if (!user) return;
    await supabase.from("friendships").update({ status }).eq("id", id);
    if (status === "accepted") {
      await grantBadge(user.id, "friend_added");
      toast.success("Amizade aceita! 🤝");
    }
    loadAll();
  };

  const remove = async (id: string) => {
    await supabase.from("friendships").delete().eq("id", id);
    toast("Amizade removida.");
    loadAll();
  };

  const sendEncouragement = async (to: string) => {
    if (!user) return;
    const message = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    const { error } = await supabase.from("encouragements").insert({ from_user_id: user.id, to_user_id: to, message });
    if (error) return toast.error("Falhou ao enviar 😢");
    toast.success("Mensagem enviada! 💛");
  };

  const markRead = async (id: string) => {
    await supabase.from("encouragements").update({ read_at: new Date().toISOString() }).eq("id", id);
    loadAll();
  };

  if (!user) return null;

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user.id);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ParticleField count={10} />
      <AppHeader title="Amigos" />
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-24">
        <Button variant="ghost" onClick={() => navigate("/hub")} className="mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao mapa
        </Button>

        {received.length > 0 && (
          <section className="mb-6 bg-codey-amber/10 border border-codey-amber/30 rounded-3xl p-5">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-codey-coral" /> Mensagens para você
            </h2>
            <ul className="space-y-2">
              {received.map((m) => (
                <li key={m.id} className="flex items-center gap-3 bg-card rounded-2xl p-3">
                  <div className="flex-1">
                    <p className="font-display text-sm font-semibold text-foreground">{m.sender}</p>
                    <p className="font-body text-sm text-muted-foreground">{m.message}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => markRead(m.id)}>OK</Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-5 mb-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-3">Buscar amigos</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do amigo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button onClick={search}><Search className="w-4 h-4" /></Button>
          </div>
          {results.length > 0 && (
            <ul className="mt-3 space-y-2">
              {results.map((p) => (
                <li key={p.user_id} className="flex items-center gap-3 bg-background rounded-2xl p-3 border border-border">
                  <span className="font-display text-sm font-semibold text-foreground flex-1">{p.display_name || "Programador"}</span>
                  <Button size="sm" onClick={() => sendRequest(p.user_id)}>
                    <UserPlus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {incoming.length > 0 && (
          <section className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-5 mb-6">
            <h2 className="font-display font-bold text-foreground mb-3">Pedidos recebidos</h2>
            <ul className="space-y-2">
              {incoming.map((f) => (
                <li key={f.id} className="flex items-center gap-3 bg-background rounded-2xl p-3 border border-border">
                  <span className="font-display text-sm flex-1 text-foreground">{profiles[f.requester_id] || "Programador"}</span>
                  <Button size="sm" onClick={() => respond(f.id, "accepted")}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => respond(f.id, "declined")}><X className="w-4 h-4" /></Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-5">
          <h2 className="font-display text-xl font-bold text-foreground mb-3">Meus amigos ({accepted.length})</h2>
          {accepted.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Nenhum amigo ainda. Busque acima para adicionar!</p>
          ) : (
            <ul className="space-y-2">
              {accepted.map((f) => {
                const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
                return (
                  <motion.li
                    key={f.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-background rounded-2xl p-3 border border-border"
                  >
                    <span className="font-display text-sm font-semibold flex-1 text-foreground">{profiles[otherId] || "Programador"}</span>
                    <Button size="sm" variant="outline" onClick={() => sendEncouragement(otherId)}>
                      <Send className="w-4 h-4 mr-1" /> Encorajar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(f.id)}><X className="w-4 h-4" /></Button>
                  </motion.li>
                );
              })}
            </ul>
          )}
          {outgoing.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">{outgoing.length} pedido(s) aguardando resposta.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Friends;
