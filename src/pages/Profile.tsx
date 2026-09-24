import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Calendar, Flame, Sparkles, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import ParticleField from "@/components/ParticleField";
import { useAuth } from "@/lib/auth-context";
import { useStats } from "@/hooks/useStats";
import { supabase } from "@/integrations/supabase/client";
import { useCompanion } from "@/lib/companion-context";
import CompanionAvatar from "@/components/CompanionAvatar";
import { useShouldFloat } from "@/components/AnimatedCompanion";
import { codeyIslands, findLesson } from "@/data/codeyContent";
const findIslandById = (id: number) => codeyIslands.find((i) => i.id === id);


interface Attempt {
  id: string;
  island_id: string;
  lesson_id: string;
  score: number;
  correct_count: number;
  total: number;
  stars: number;
  completed: boolean;
  created_at: string;
}

interface Badge {
  code: string;
  name: string;
  description: string;
  earned_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { stats } = useStats();
  // Antes começava com o mascote Codey e trocava depois → "personagem errado".
  const { companion, isResolved } = useCompanion();
  const floats = useShouldFloat(companion);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("lesson_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!cancelled) setAttempts((data as Attempt[]) || []);
      });

    supabase
      .from("user_badges")
      .select("badge_code, earned_at, badges(name, description)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setBadges(
          (data || []).map((row: { badge_code: string; earned_at: string; badges: { name: string; description: string } | null }) => ({
            code: row.badge_code,
            name: row.badges?.name || row.badge_code,
            description: row.badges?.description || "",
            earned_at: row.earned_at,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const nextLevelAt = stats.level * 100;
  const progressInLevel = stats.totalPoints - (stats.level - 1) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ParticleField count={12} />
      <AppHeader title="Meu perfil" />

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 pb-24">
        <Button variant="ghost" onClick={() => navigate("/hub")} className="mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao mapa
        </Button>

        <motion.div
          className="grid md:grid-cols-[auto_1fr] gap-5 items-center bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-6 md:p-8 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div className="w-32 h-32 mx-auto" animate={floats ? { y: [0, -8, 0] } : { y: 0 }} transition={{ duration: 3.5, repeat: Infinity }}>
            <CompanionAvatar className="w-32 h-32" />
          </motion.div>
          <div>
            <p className="font-display text-sm text-primary font-semibold">{isResolved ? `Companheiro ${companion.name}` : "\u00a0"}</p>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">{user?.name}</h1>
            <p className="font-body text-muted-foreground text-sm mb-4">Nível {stats.level} · próximo nível em {Math.max(0, nextLevelAt - stats.totalPoints)} pts</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (progressInLevel / 100) * 100)}%` }} />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<Sparkles className="w-5 h-5" />} label="Pontos" value={stats.totalPoints} tint="primary" />
          <StatCard icon={<Flame className="w-5 h-5" />} label="Streak" value={`${stats.streak}d`} tint="amber" />
          <StatCard icon={<Trophy className="w-5 h-5" />} label="Semanal" value={stats.weekly} tint="lavender" />
          <StatCard icon={<Award className="w-5 h-5" />} label="Badges" value={badges.length} tint="moss" />
        </div>

        <section className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-5 md:p-6 mb-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-codey-amber" /> Conquistas
          </h2>
          {badges.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Ainda sem conquistas. Complete lições para desbloquear!</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {badges.map((b) => (
                <div key={b.code} className="rounded-2xl border border-border bg-background/80 p-4">
                  <p className="font-display font-bold text-foreground">🏅 {b.name}</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">{b.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-5 md:p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Histórico de tentativas
          </h2>
          {attempts.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Ainda sem tentativas. Bora começar? 🌱</p>
          ) : (
            <ul className="divide-y divide-border">
              {attempts.map((a) => {
                const island = findIslandById(Number(a.island_id));
                const lesson = findLesson(Number(a.island_id), a.lesson_id);
                const date = new Date(a.created_at);
                return (
                  <li key={a.id} className="py-3 flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < a.stars ? "fill-codey-amber text-codey-amber" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold text-foreground truncate">
                        {lesson?.title || `Lição ${a.lesson_id}`}
                        {island && <span className="text-muted-foreground font-normal"> · {island.shortName}</span>}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {date.toLocaleDateString("pt-BR")} {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {a.correct_count}/{a.total} acertos
                      </p>
                    </div>
                    <span className="font-display font-bold text-primary">+{a.score}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: React.ReactNode; tint: "primary" | "amber" | "lavender" | "moss" }) => {
  const cls = {
    primary: "bg-primary/10 text-primary border-primary/20",
    amber: "bg-codey-amber/15 text-codey-amber border-codey-amber/30",
    lavender: "bg-codey-lavender/20 text-codey-lavender-deep border-codey-lavender/30",
    moss: "bg-codey-moss/15 text-codey-moss border-codey-moss/30",
  }[tint];
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<p className="font-display text-xs font-semibold">{label}</p></div>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
};

export default Profile;
