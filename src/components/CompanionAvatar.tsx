import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCompanion } from "@/lib/companion-context";
import type { Companion } from "@/lib/companions";
import AnimatedCompanion, { hasAnimation } from "@/components/AnimatedCompanion";
import { auraGradient } from "@/lib/character-prefs";

/**
 * Mostra o companheiro sem "piscar" outro personagem enquanto carrega.
 * Enquanto não sabemos quem é o companheiro, exibe um círculo neutro e suave
 * (em vez do mascote, que parecia "o personagem errado").
 */
export const CompanionAvatar = ({
  companion: override,
  className,
  alt,
  animated = true,
  aura: auraOverride,
  showAura = true,
}: {
  companion?: Companion;
  className?: string;
  alt?: string;
  /** false = sempre a imagem estática (ex.: listas/miniaturas) */
  animated?: boolean;
  /** aura a mostrar (o criador passa a cor que está sendo escolhida); padrão: a salva */
  aura?: number;
  showAura?: boolean;
}) => {
  const { companion: fromCtx, isResolved, aura: savedAura } = useCompanion();
  const companion = override ?? fromCtx;
  const resolved = !!override || isResolved;
  const inner =
    animated && resolved && hasAnimation(companion) ? (
      <AnimatedCompanion companion={companion} className="relative w-full h-full" alt={alt} />
    ) : (
      <StaticAvatar companion={companion} className="relative w-full h-full" alt={alt} resolved={resolved} />
    );
  return (
    <span className={cn("relative inline-block", className)}>
      {showAura && resolved && (
        // Aura: a cor escolhida no criador de personagem, como um brilho suave atrás do companheiro.
        <span
          aria-hidden
          className="absolute -inset-[10%] rounded-full pointer-events-none transition-[background] duration-500"
          style={{ background: auraGradient(auraOverride ?? savedAura) }}
        />
      )}
      {inner}
    </span>
  );
};

const StaticAvatar = ({
  companion,
  className,
  alt,
  resolved,
}: {
  companion: Companion;
  className?: string;
  alt?: string;
  resolved: boolean;
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const ready = resolved && loadedSrc === companion.img;

  return (
    <span className={cn("relative inline-block", className)}>
      {!ready && <span aria-hidden className="absolute inset-[12%] rounded-full bg-muted/60" />}
      {resolved && (
        <img
          key={companion.img}
          src={companion.img}
          alt={alt ?? companion.name}
          decoding="async"
          draggable={false}
          onLoad={() => setLoadedSrc(companion.img)}
          onError={() => setLoadedSrc(companion.img)}
          className={cn("relative w-full h-full object-contain transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
        />
      )}
    </span>
  );
};

export default CompanionAvatar;
