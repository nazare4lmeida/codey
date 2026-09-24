import { motion } from "framer-motion";

type Variant = "turquoise" | "lavender" | "amber" | "moss" | "coral" | "sky";

const PALETTES: Record<Variant, { a: string; b: string; c: string }> = {
  turquoise: { a: "var(--codey-turquoise)", b: "var(--codey-sky)", c: "var(--codey-lavender)" },
  lavender:  { a: "var(--codey-lavender)", b: "var(--codey-sky)", c: "var(--codey-turquoise-soft)" },
  amber:     { a: "var(--codey-amber-glow)", b: "var(--codey-coral)", c: "var(--codey-cream)" },
  moss:      { a: "var(--codey-moss-soft)", b: "var(--codey-turquoise-soft)", c: "var(--codey-cream)" },
  coral:     { a: "var(--codey-coral)", b: "var(--codey-amber-glow)", c: "var(--codey-lavender)" },
  sky:       { a: "var(--codey-sky)", b: "var(--codey-turquoise-soft)", c: "var(--codey-lavender)" },
};

/**
 * Fundo aquarela suave, reutilizável. Sensorialmente calmo — sem estímulos
 * agressivos. Usa os tokens Codey para respeitar tema claro/escuro.
 */
export const AuroraBackground = ({
  variant = "turquoise",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) => {
  const p = PALETTES[variant];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden ${className}`}
    >
      <motion.div
        className="absolute -top-24 -left-24 w-[55vw] h-[55vw] rounded-full blur-3xl opacity-40 dark:opacity-20"
        style={{ background: `radial-gradient(circle at 30% 30%, hsl(${p.a} / 0.55), transparent 65%)` }}
        animate={{ x: [0, 24, -12, 0], y: [0, -16, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 w-[60vw] h-[60vw] rounded-full blur-3xl opacity-40 dark:opacity-20"
        style={{ background: `radial-gradient(circle at 60% 40%, hsl(${p.b} / 0.5), transparent 65%)` }}
        animate={{ x: [0, -18, 10, 0], y: [0, 14, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/4 w-[65vw] h-[65vw] rounded-full blur-3xl opacity-35 dark:opacity-15"
        style={{ background: `radial-gradient(circle at 40% 60%, hsl(${p.c} / 0.45), transparent 65%)` }}
        animate={{ x: [0, 14, -20, 0], y: [0, -10, 14, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/70" />
    </div>
  );
};

export default AuroraBackground;
