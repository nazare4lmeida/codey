import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type AnswerFn = (ok: boolean, text: string) => void;

/**
 * FillCode: apresenta um trecho de código com lacunas (___) e opções de
 * blocos. O aluno seleciona cada opção para preencher os espaços na ordem.
 */
export const FillCode = ({
  language = "javascript",
  code,
  blanks,
  options,
  explanation,
  disabled,
  onAnswer,
}: {
  language?: string;
  code: string; // usa "___" para marcar lacunas, na ordem
  blanks: string[]; // respostas corretas na ordem em que aparecem
  options: string[]; // banco de blocos (inclui distratores)
  explanation: string;
  disabled: boolean;
  onAnswer: AnswerFn;
}) => {
  const parts = useMemo(() => code.split("___"), [code]);
  const gapCount = parts.length - 1;
  const [filled, setFilled] = useState<(string | null)[]>(() => Array(gapCount).fill(null));

  useEffect(() => {
    setFilled(Array(gapCount).fill(null));
  }, [gapCount, code]);

  const nextGap = filled.findIndex((f) => f === null);
  const usedCount: Record<string, number> = {};
  filled.forEach((f) => { if (f) usedCount[f] = (usedCount[f] || 0) + 1; });

  const remainingOf = (opt: string) => {
    const total = options.filter((o) => o === opt).length;
    return total - (usedCount[opt] || 0);
  };

  const pick = (opt: string) => {
    if (disabled || nextGap === -1) return;
    setFilled((prev) => {
      const next = [...prev];
      next[nextGap] = opt;
      return next;
    });
  };

  const clearAt = (i: number) => {
    if (disabled) return;
    setFilled((prev) => prev.map((v, idx) => (idx === i ? null : v)));
  };

  const reset = () => setFilled(Array(gapCount).fill(null));

  const check = () => {
    const ok = filled.every((v, i) => v === blanks[i]);
    onAnswer(
      ok,
      ok ? `Código completo e correto! ${explanation}` : `Ainda faltam ajustes. ${explanation}`,
    );
  };

  const allFilled = filled.every((f) => f !== null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Code2 className="w-4 h-4 text-primary" />
        <span>Toque nos blocos abaixo para preencher as lacunas na ordem.</span>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white overflow-hidden font-mono text-sm">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-slate-500">{language}</span>
        </div>
        <pre className="p-3 text-slate-800 whitespace-pre-wrap leading-6">
          {parts.map((chunk, i) => (
            <span key={i}>
              {chunk}
              {i < gapCount && (
                <button
                  type="button"
                  disabled={disabled || !filled[i]}
                  onClick={() => clearAt(i)}
                  className={`inline-block align-baseline mx-0.5 px-2 py-0.5 rounded-md border ${
                    filled[i]
                      ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20"
                      : i === nextGap
                      ? "border-primary border-dashed bg-primary/5 text-primary/60 animate-pulse-soft"
                      : "border-slate-300 border-dashed bg-slate-50 text-slate-400"
                  }`}
                  aria-label={filled[i] ? `Lacuna ${i + 1}: ${filled[i]} (toque para limpar)` : `Lacuna ${i + 1} vazia`}
                >
                  {filled[i] ?? `___`}
                </button>
              )}
            </span>
          ))}
        </pre>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-3">
        <p className="font-display text-xs text-muted-foreground mb-2">Blocos disponíveis</p>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(options)).map((opt) => {
            const left = remainingOf(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled || left <= 0 || nextGap === -1}
                onClick={() => pick(opt)}
                className="rounded-lg border border-border bg-card px-2 py-1 font-mono text-xs hover:border-primary/60 disabled:opacity-40"
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="hero" onClick={check} disabled={disabled || !allFilled}>
          <Check className="w-4 h-4" /> Conferir código
        </Button>
        <Button variant="outline" type="button" onClick={reset} disabled={disabled || filled.every((v) => v === null)}>
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </Button>
      </div>
    </div>
  );
};

export default FillCode;
