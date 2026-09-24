import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Companion } from "@/lib/companions";
import { getAnimation, pickClip, sheetUrl, type ClipName } from "@/lib/companionAnimations";
import { onCompanionReaction } from "@/lib/companion-reaction";
import { useCalmMotion } from "@/lib/motion";

/**
 * Companheiro animado a partir das folhas de quadros recortadas dos vídeos.
 *
 * - Fica no loop "parado" e reage aos eventos da lição (acerto/erro), voltando sozinho ao parado.
 * - "Animações calmas" ligado: mostra a pose parada, sem movimento nem reações.
 * - Carrega primeiro só o "parado"; as outras emoções vêm em segundo plano.
 * - Enquanto a animação não chega, mostra a imagem estática (nunca fica em branco).
 * - Pausa sozinho quando sai da tela ou a aba fica em segundo plano.
 */

// Cache compartilhado: várias instâncias do mesmo companheiro baixam cada folha uma vez só.
const sheetCache = new Map<string, Promise<HTMLImageElement>>();
const loadSheet = (url: string) => {
  let p = sheetCache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    p.catch(() => sheetCache.delete(url));
    sheetCache.set(url, p);
  }
  return p;
};

export const hasAnimation = (companion: Companion) => !!getAnimation(companion.id);

/**
 * O "flutuar" antigo (feito com framer-motion) só vale para quem NÃO tem animação de vídeo,
 * e some no modo calmo — para nunca somar dois movimentos ao mesmo tempo.
 */
export const useShouldFloat = (companion: Companion) => {
  const calm = useCalmMotion();
  return !calm && !hasAnimation(companion);
};

export const AnimatedCompanion = ({
  companion,
  className,
  alt,
  clickClips,
}: {
  companion: Companion;
  className?: string;
  alt?: string;
  /** Emoções que tocam ao clicar (alternando). Sem isso, o companheiro só reage aos eventos da lição. */
  clickClips?: ClipName[];
}) => {
  const anim = getAnimation(companion.id);
  const calm = useCalmMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheets = useRef<Partial<Record<ClipName, HTMLImageElement>>>({});
  const state = useRef({ clip: "parado" as ClipName, frame: 0, last: 0 });
  const visible = useRef(true);
  const [ready, setReady] = useState(false);
  const clickTurn = useRef(0);

  // Desenha um quadro da emoção atual.
  const draw = () => {
    const c = canvasRef.current;
    if (!c || !anim) return;
    const { clip, frame } = state.current;
    const meta = anim[clip];
    const img = sheets.current[clip];
    if (!meta || !img) return;
    const g = c.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    g.imageSmoothingQuality = "high";
    g.drawImage(img, (frame % meta.cols) * meta.size, Math.floor(frame / meta.cols) * meta.size, meta.size, meta.size, 0, 0, c.width, c.height);
  };

  // Carrega as folhas: primeiro "parado", depois as demais sem pressa.
  useEffect(() => {
    if (!anim) return;
    let cancelled = false;
    sheets.current = {};
    state.current = { clip: "parado", frame: 0, last: 0 };
    setReady(false);
    const idleUrl = sheetUrl(companion.id, "parado");
    if (!idleUrl) return;
    loadSheet(idleUrl)
      .then((img) => {
        if (cancelled) return;
        sheets.current.parado = img;
        setReady(true);
        draw();
        const rest = (Object.keys(anim) as ClipName[]).filter((c) => c !== "parado");
        const later = () =>
          rest.forEach((clip) => {
            const url = sheetUrl(companion.id, clip);
            if (url)
              loadSheet(url)
                .then((im) => {
                  if (!cancelled) sheets.current[clip] = im;
                })
                .catch(() => undefined);
          });
        const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
        if (w.requestIdleCallback) w.requestIdleCallback(later);
        else setTimeout(later, 800);
      })
      .catch(() => undefined); // sem animação: segue a imagem estática
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega só ao trocar de companheiro
  }, [companion.id]);

  // Pausa quando sai da tela.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(c);
    return () => io.disconnect();
  }, []);

  // Laço de animação (desligado no modo calmo).
  useEffect(() => {
    if (!anim || !ready) return;
    if (calm) {
      state.current = { clip: "parado", frame: 0, last: 0 };
      draw();
      return;
    }
    let raf = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible.current || document.hidden) return;
      const s = state.current;
      const meta = anim[s.clip] ?? anim.parado;
      if (t - s.last < 1000 / meta.fps) return;
      s.last = t;
      s.frame += 1;
      if (s.frame >= meta.frames) {
        if (meta.loop) s.frame = 0;
        else state.current = { clip: "parado", frame: 0, last: t };
      }
      draw();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, ready, calm]);

  // Toca uma emoção (baixa a folha na hora, se ainda não tiver chegado).
  const playClip = (clip: ClipName) => {
    if (!anim || calm || !anim[clip]) return;
    const play = () => {
      state.current = { clip, frame: 0, last: 0 };
      draw();
    };
    if (sheets.current[clip]) return play();
    const url = sheetUrl(companion.id, clip);
    if (!url) return;
    const asked = performance.now();
    loadSheet(url)
      .then((img) => {
        sheets.current[clip] = img;
        if (performance.now() - asked < 1500) play(); // se demorar demais, já perdeu o sentido
      })
      .catch(() => undefined);
  };

  // Reage aos eventos da lição.
  useEffect(() => {
    if (!anim) return;
    return onCompanionReaction((r) => {
      const clip = pickClip(anim, r);
      if (clip) playClip(clip);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, calm, companion.id]);

  const onClick =
    clickClips && clickClips.length
      ? () => {
          if (state.current.clip !== "parado") return; // deixa terminar a reação atual
          playClip(clickClips[clickTurn.current++ % clickClips.length]);
        }
      : undefined;

  if (!anim) return null;

  return (
    <span
      className={cn("relative inline-block", onClick && !calm && "cursor-pointer", className)}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={alt ?? companion.name}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {!ready && (
        <img src={companion.img} alt="" aria-hidden decoding="async" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      )}
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        aria-hidden
        className={cn("relative w-full h-full transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
      />
    </span>
  );
};

export default AnimatedCompanion;
