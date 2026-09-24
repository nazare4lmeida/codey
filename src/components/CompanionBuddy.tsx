import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { codeyTips, randomFrom, type Companion } from "@/lib/companions";
import CompanionAvatar from "@/components/CompanionAvatar";
import { useShouldFloat } from "@/components/AnimatedCompanion";

type Mood = "idle" | "celebrate" | "encourage" | "tip";

type Bubble = { mood: Mood; text: string; id: number };

export const CompanionBuddy = ({
  companion,
  mood,
  message,
  reactionKey,
  tipsEnabled = true,
  tipIntervalMs = 45000,
}: {
  companion: Companion;
  mood?: Mood;
  message?: string | null;
  reactionKey?: number;
  tipsEnabled?: boolean;
  tipIntervalMs?: number;
}) => {
  const [bubble, setBubble] = useState<Bubble | null>(null);

  const floats = useShouldFloat(companion);

  // React to external mood/message changes (celebrate/encourage)
  useEffect(() => {
    if (!mood || mood === "idle" || !message) return;
    const id = Date.now();
    setBubble({ mood, text: message, id });
    const duration = mood === "celebrate" ? 3500 : mood === "encourage" ? 4500 : 6000;
    const t = setTimeout(() => setBubble((b) => (b?.id === id ? null : b)), duration);
    return () => clearTimeout(t);
  }, [mood, message, reactionKey]);

  // Periodic tips
  useEffect(() => {
    if (!tipsEnabled) return;
    const showTip = () => {
      const id = Date.now();
      setBubble((b) => (b && b.mood !== "tip" ? b : { mood: "tip", text: randomFrom(codeyTips), id }));
      setTimeout(() => setBubble((b) => (b?.id === id ? null : b)), 9000);
    };
    const first = setTimeout(showTip, 12000);
    const interval = setInterval(showTip, tipIntervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [tipsEnabled, tipIntervalMs]);

  const ring =
    bubble?.mood === "celebrate"
      ? "ring-codey-amber/50 shadow-[0_0_30px_hsl(var(--codey-amber)/0.4)]"
      : bubble?.mood === "encourage"
        ? "ring-codey-coral/40"
        : bubble?.mood === "tip"
          ? "ring-primary/40"
          : "ring-border";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-end gap-2 md:bottom-6 md:right-6">
      <AnimatePresence>
        {bubble && (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto max-w-[260px] rounded-2xl border border-border bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg relative"
          >
            <button
              type="button"
              aria-label="Fechar mensagem"
              onClick={() => setBubble(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="font-display text-xs text-primary font-semibold mb-0.5">
              {companion.name}
              {bubble.mood === "tip" && " · dica"}
            </p>
            <p className="font-body text-sm text-foreground leading-snug">{bubble.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto flex flex-col items-center gap-1">
        <motion.div
          animate={
            !floats
              ? { y: 0, rotate: 0 }
              : bubble?.mood === "celebrate"
              ? { y: [0, -14, 0, -10, 0], rotate: [0, -6, 6, -4, 0] }
              : bubble?.mood === "encourage"
                ? { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
                : { y: [0, -6, 0] }
          }
          transition={
            bubble?.mood === "celebrate"
              ? { duration: 0.9, repeat: 1 }
              : bubble?.mood === "encourage"
                ? { duration: 1.6 }
                : { duration: 3.5, repeat: Infinity }
          }
          className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-card/90 backdrop-blur-sm ring-2 ${ring} overflow-hidden transition-shadow`}
        >
          <CompanionAvatar className="w-full h-full" alt={companion.name} />
        </motion.div>
        <span className="font-display text-[11px] md:text-xs font-semibold text-foreground bg-card/90 backdrop-blur-sm border border-border rounded-full px-2 py-0.5 shadow-sm">
          {companion.name}
        </span>
      </div>
    </div>
  );
};

export default CompanionBuddy;
