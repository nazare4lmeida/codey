import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import ParticleField from "@/components/ParticleField";
import AppHeader from "@/components/AppHeader";
import { codeyIslands, lessonsForIsland } from "@/data/codeyContent";
import mascotImg from "@/assets/codey-mascot.webp";
import { getIslandImage } from "@/lib/islandImages";
import { isIslandUnlocked, unlockReason } from "@/lib/islandUnlock";
import { Code2, Lock, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useCompanion } from "@/lib/companion-context";
import { loadLocalCompleted, retryPendingWhenOnline, syncCompleted } from "@/lib/progress";

const worlds = codeyIslands.map((island) => ({
  ...island,
  image: getIslandImage(island.id),
  lessons: lessonsForIsland(island.id).length,
  desc: `Aprenda ${island.focus} com perguntas, respostas guiadas e desafios de código.`,
  level: island.weeksLabel,
}));

const WorldHub = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { hasCharacter, status: companionStatus } = useCompanion();
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => loadLocalCompleted(user?.id));

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  // Só manda para o criador quando o servidor CONFIRMOU que não há personagem.
  // Antes, qualquer erro de rede caía aqui e a escolha da criança podia ser
  // sobrescrita pela Vix ao clicar em "Entrar no mapa".
  useEffect(() => {
    if (user && companionStatus === "ready" && hasCharacter === false) navigate("/character");
  }, [user, companionStatus, hasCharacter, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setCompletedLessons(loadLocalCompleted(user.id));
    syncCompleted(user.id).then((merged) => {
      if (!cancelled) setCompletedLessons(merged);
    });
    const stop = retryPendingWhenOnline(user.id);
    return () => {
      cancelled = true;
      stop();
    };
  }, [user]);

  const handleWorldClick = (world: (typeof worlds)[0]) => {
    if (!isIslandUnlocked(world.id, completedLessons)) {
      return;
    }
    toast.success(`Abrindo ${world.shortName}... 💡`);
    navigate(`/world/${world.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.img
          src={mascotImg}
          alt="Carregando..."
          className="w-20 h-20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ParticleField count={15} />

      <AppHeader title="Mapa das 12 Ilhas" />


      {/* Welcome */}
      <motion.div
        className="relative z-10 text-center pt-6 sm:pt-10 pb-4 sm:pb-6 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Olá, {user?.name || "Programador"}! <Sparkles className="inline w-6 h-6 text-codey-amber" />
        </h1>
        <p className="text-muted-foreground font-body">
          Escolha uma ilha para abrir lições, perguntas e desafios de código
        </p>
      </motion.div>

      {/* Worlds Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        {worlds.map((world, i) => {
          const unlocked = isIslandUnlocked(world.id, completedLessons);
          const reason = !unlocked ? unlockReason(world.id) : null;
          return (
          <motion.div
            key={world.id}
            className={`group relative rounded-3xl overflow-hidden border border-border bg-card transition-all duration-300 ${
              unlocked ? "cursor-pointer hover:shadow-lg hover:scale-[1.02]" : "cursor-not-allowed"
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.2 }}
            onClick={() => handleWorldClick(world)}
            aria-disabled={!unlocked}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={world.image}
                alt={world.name}
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  unlocked ? "group-hover:scale-110" : "grayscale opacity-60"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <span className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm text-foreground font-display text-xs font-semibold px-3 py-1 rounded-full">
                {world.level}
              </span>
              <span className="absolute top-3 right-3 bg-codey-amber/90 text-accent-foreground font-display text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Trophy className="w-3 h-3" /> {world.treasureName.split("—")[0].trim()}
              </span>
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-card/90 border border-border flex items-center justify-center">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {reason && (
                      <span className="text-xs font-display font-semibold text-foreground bg-card/90 px-3 py-1 rounded-full max-w-[220px]">
                        {reason}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="font-display font-bold text-lg text-foreground">
                  {world.name}
                </h3>
                <span className="text-xs font-display font-semibold text-codey-turquoise bg-codey-turquoise/10 px-2.5 py-1 rounded-full whitespace-nowrap mt-0.5">
                  {world.lessons} lições
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-body">{world.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-display text-primary">
                {unlocked ? (
                  <><Code2 className="w-4 h-4" /> Abrir desafios</>
                ) : (
                  <><Lock className="w-4 h-4" /> Em breve</>
                )}
              </div>
            </div>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WorldHub;
