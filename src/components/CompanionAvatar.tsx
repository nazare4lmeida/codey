import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCompanion } from "@/lib/companion-context";
import type { Companion } from "@/lib/companions";
import AnimatedCompanion, { hasAnimation } from "@/components/AnimatedCompanion";

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
}: {
  companion?: Companion;
  className?: string;
  alt?: string;
  /** false = sempre a imagem estática (ex.: listas/miniaturas) */
  animated?: boolean;
}) => {
  const { companion: fromCtx, isResolved } = useCompanion();
  const companion = override ?? fromCtx;
  if (animated && (override || isResolved) && hasAnimation(companion)) {
    return <AnimatedCompanion companion={companion} className={className} alt={alt} />;
  }
  return <StaticAvatar companion={companion} className={className} alt={alt} resolved={!!override || isResolved} />;
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
