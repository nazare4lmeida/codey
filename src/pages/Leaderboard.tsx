import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import ParticleField from "@/components/ParticleField";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  user_id: string;
  display_name: string;
  weekly_points: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("weekly_leaderboard", { _limit: 20 }).then(({ data }) => {
      setRows((data as Row[]) || []);
    });
  }, [user]);

  const podium = ["text-codey-amber", "text-codey-lavender-deep", "text-codey-coral"];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ParticleField count={12} />
      <AppHeader title="Ranking semanal" />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 pb-24">
        <Button variant="ghost" onClick={() => navigate("/hub")} className="mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao mapa
        </Button>

        <motion.header
          className="text-center bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-6 md:p-8 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Trophy className="w-12 h-12 mx-auto text-codey-amber mb-2" />
          <h1 className="font-display text-3xl font-bold text-foreground">Ranking da semana</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Reinicia toda segunda-feira. Bora subir!</p>
        </motion.header>

        {rows.length === 0 ? (
          <p className="text-center font-body text-muted-foreground">Ninguém pontuou essa semana ainda. Seja o primeiro!</p>
        ) : (
          <ol className="space-y-2">
            {rows.map((r, i) => {
              const isMe = r.user_id === user?.id;
              return (
                <motion.li
                  key={r.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 rounded-2xl p-4 border ${
                    isMe ? "bg-primary/10 border-primary/40" : "bg-card/80 border-border"
                  } backdrop-blur-sm`}
                >
                  <div className="w-8 text-center">
                    {i < 3 ? (
                      i === 0 ? <Crown className={`w-6 h-6 mx-auto ${podium[i]}`} /> : <Medal className={`w-6 h-6 mx-auto ${podium[i]}`} />
                    ) : (
                      <span className="font-display font-bold text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <p className="flex-1 font-display font-semibold text-foreground truncate">
                    {r.display_name || "Programador"}
                    {isMe && <span className="ml-2 text-xs text-primary">(você)</span>}
                  </p>
                  <span className="font-display font-bold text-primary">{r.weekly_points} pts</span>
                </motion.li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
