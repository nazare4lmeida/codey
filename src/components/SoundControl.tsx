import { ChevronDown, Volume1, Volume2, VolumeX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { sfx, soundStore, useSoundPrefs } from "@/lib/sound";
import { motionStore, useCalmMotion } from "@/lib/motion";

/**
 * Controle de som sempre visível.
 * - Botão principal: liga/desliga com UM toque (o mais importante quando a
 *   criança se sente sobrecarregada). Ícone + cor mudam de forma bem clara.
 * - Setinha ao lado: abre volume (baixinho → alto) e "Testar som".
 * - Atalho de teclado: M (ignorado enquanto digita no editor de código).
 * A preferência fica salva neste aparelho.
 */
export const SoundControl = ({ className = "" }: { className?: string }) => {
  const { muted, volume } = useSoundPrefs();
  const calm = useCalmMotion();
  const off = muted || volume <= 0;
  const Icon = off ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => {
          soundStore.toggleMuted();
          if (off) setTimeout(() => sfx.tap(), 30); // confirma, bem baixinho, que o som voltou
        }}
        aria-pressed={!off}
        aria-label={off ? "Som desligado. Toque para ligar" : "Som ligado. Toque para desligar"}
        title={off ? "Ligar som (M)" : "Desligar som (M)"}
        className={cn(
          "h-9 pl-3 pr-2 flex items-center gap-1.5 font-display text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          off ? "text-muted-foreground hover:text-foreground" : "text-primary hover:bg-primary/10",
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{off ? "Som off" : "Som on"}</span>
      </button>
      <Popover>
        <PopoverTrigger
          aria-label="Ajustar som e movimento"
          title="Som e movimento"
          className="h-9 px-1.5 border-l border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 rounded-2xl">
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="font-display text-sm font-semibold text-foreground">{off ? "Som desligado" : "Som ligado"}</span>
              <Switch checked={!off} onCheckedChange={(on) => soundStore.setMuted(!on)} aria-label="Ligar ou desligar som" />
            </label>
            <div className={cn("space-y-2 transition-opacity", off && "opacity-50")}>
              <p className="font-display text-xs text-muted-foreground" id="codey-volume-label">
                Volume: {Math.round(volume * 100)}%
              </p>
              <Slider
                aria-labelledby="codey-volume-label"
                value={[Math.round(volume * 100)]}
                min={0}
                max={100}
                step={10}
                onValueChange={([v]) => soundStore.setVolume(v / 100)}
                onValueCommit={() => sfx.correct()}
              />
              <div className="flex justify-between font-body text-[11px] text-muted-foreground">
                <span>baixinho</span>
                <span>alto</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => sfx.correct()}
              disabled={off}
              className="w-full rounded-xl border border-border bg-background py-2 font-display text-sm text-foreground hover:border-primary/60 disabled:opacity-50 transition"
            >
              🔔 Testar som
            </button>
            <div className="border-t border-border pt-4">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="font-display text-sm font-semibold text-foreground">Animações calmas</span>
                <Switch checked={calm} onCheckedChange={(v) => motionStore.setCalm(v)} aria-label="Animações calmas" />
              </label>
              <p className="mt-1 font-body text-[11px] text-muted-foreground leading-snug">
                O companheiro fica parado, sem pular nem reagir. Bom para dias mais sensíveis.
              </p>
            </div>
            <p className="font-body text-[11px] text-muted-foreground leading-snug">
              Dica: aperte <kbd className="px-1 rounded bg-muted font-mono">M</kbd> para ligar/desligar a qualquer momento.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SoundControl;
