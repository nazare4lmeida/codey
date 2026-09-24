import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bug, Check, Play, Puzzle, RotateCcw, Sparkles, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Companion } from "@/lib/companions";
import { sfx } from "@/lib/sound";

type AnswerFn = (ok: boolean, text: string) => void;

// ---------- WIRE MATCH ----------
export const WireMatch = ({
  pairs,
  explanation,
  disabled,
  onAnswer,
}: {
  pairs: { left: string; right: string }[];
  explanation: string;
  disabled: boolean;
  onAnswer: AnswerFn;
}) => {
  const rights = useMemo(() => [...pairs.map((p) => p.right)].sort(() => Math.random() - 0.5), [pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, string>>({});

  const tryConnect = (right: string) => {
    if (!selectedLeft || disabled) return;
    setConnections((prev) => {
      const next = { ...prev };
      // remove any prior mapping that used this right (allow swap)
      for (const k of Object.keys(next)) if (next[k] === right) delete next[k];
      next[selectedLeft] = right;
      return next;
    });
    setSelectedLeft(null);
  };

  const selectLeft = (left: string) => {
    if (disabled) return;
    // clicking a left clears its current mapping so user can reassign
    setConnections((prev) => {
      if (!(left in prev)) return prev;
      const next = { ...prev };
      delete next[left];
      return next;
    });
    setSelectedLeft(left);
  };

  const reset = () => {
    setConnections({});
    setSelectedLeft(null);
  };

  const allConnected = Object.keys(connections).length === pairs.length;
  const usedRights = new Set(Object.values(connections));

  const check = () => {
    const allOk = pairs.every((p) => connections[p.left] === p.right);
    onAnswer(allOk, allOk ? `Todas as ligações certas! ${explanation}` : `Algumas ligações ficaram trocadas. ${explanation}`);
  };

  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-muted-foreground">
        Toque em um item da esquerda e depois no par correspondente da direita.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((p) => {
            const connected = connections[p.left];
            const active = selectedLeft === p.left;
            return (
              <button
                key={p.left}
                type="button"
                disabled={disabled}
                onClick={() => selectLeft(p.left)}
                className={`w-full rounded-2xl border p-3 text-left font-body transition ${
                  active
                    ? "border-primary bg-primary/10"
                    : connected
                    ? "border-codey-moss/40 bg-codey-moss/10"
                    : "border-border bg-background hover:border-primary/60"
                }`}
              >
                <div className="font-display font-semibold text-foreground">{p.left}</div>
                {connected && (
                  <div className="font-body text-xs text-muted-foreground mt-1">↔ {connected}</div>
                )}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rights.map((r) => {
            const used = usedRights.has(r);
            return (
              <button
                key={r}
                type="button"
                disabled={disabled || used}
                onClick={() => tryConnect(r)}
                className={`w-full rounded-2xl border p-3 text-left font-body transition ${
                  used
                    ? "border-border bg-muted/50 text-muted-foreground"
                    : "border-border bg-background hover:border-primary/60"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="hero" disabled={disabled || !allConnected} onClick={check}>
          <Check className="w-4 h-4" /> Conferir ligações
        </Button>
        <Button variant="outline" type="button" onClick={reset} disabled={disabled}>
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </Button>
      </div>
    </div>
  );
};

// ---------- BUG HUNT ----------
export const BugHunt = ({
  lines,
  buggyIndex,
  explanation,
  hint,
  language,
  disabled,
  onAnswer,
}: {
  lines: string[];
  buggyIndex: number;
  explanation: string;
  hint: string;
  language?: string;
  disabled: boolean;
  onAnswer: AnswerFn;
}) => {
  const [picked, setPicked] = useState<number | null>(null);
  const handle = (i: number) => {
    if (disabled) return;
    setPicked(i);
    const ok = i === buggyIndex;
    onAnswer(ok, ok ? `Você achou o bug! ${explanation}` : `Essa linha está ok. Dica: ${hint}`);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bug className="w-4 h-4 text-codey-coral" />
        <span>Toque na linha que está com o problema {language ? `(${language})` : ""}.</span>
      </div>
      <div className="rounded-xl border border-slate-300 bg-white overflow-hidden font-mono text-sm">
        {lines.map((line, i) => {
          const isPicked = picked === i;
          const isCorrect = isPicked && i === buggyIndex;
          const isWrong = isPicked && i !== buggyIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => handle(i)}
              className={`w-full grid grid-cols-[2.5rem_1fr] text-left transition ${
                isCorrect
                  ? "bg-codey-moss/20"
                  : isWrong
                  ? "bg-codey-coral/20"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="select-none text-slate-400 bg-slate-50 border-r border-slate-200 px-2 py-1 text-right">
                {i + 1}
              </div>
              <pre className="px-3 py-1 text-slate-800 whitespace-pre-wrap">{line}</pre>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---------- MEMORY MATCH ----------
type Card = { id: number; group: number; label: string; flipped: boolean; matched: boolean };

export const MemoryMatch = ({
  pairs,
  explanation,
  disabled,
  onAnswer,
}: {
  pairs: { a: string; b: string }[];
  explanation: string;
  disabled: boolean;
  onAnswer: AnswerFn;
}) => {
  const initial = useMemo<Card[]>(() => {
    const all: Card[] = [];
    pairs.forEach((p, i) => {
      all.push({ id: i * 2, group: i, label: p.a, flipped: false, matched: false });
      all.push({ id: i * 2 + 1, group: i, label: p.b, flipped: false, matched: false });
    });
    return all.sort(() => Math.random() - 0.5);
  }, [pairs]);

  const [cards, setCards] = useState<Card[]>(initial);
  const [picked, setPicked] = useState<number[]>([]);
  const [tries, setTries] = useState(0);

  const answeredRef = useRef(false);

  useEffect(() => {
    setCards(initial);
    setPicked([]);
    setTries(0);
    answeredRef.current = false;
  }, [initial]);

  useEffect(() => {
    if (picked.length !== 2) return;
    const [a, b] = picked;
    const timer = setTimeout(() => {
      setCards((prev) => {
        const cardA = prev.find((c) => c.id === a);
        const cardB = prev.find((c) => c.id === b);
        const match = !!cardA && !!cardB && cardA.group === cardB.group;
        return prev.map((c) => {
          if (c.id !== a && c.id !== b) return c;
          if (match) return { ...c, matched: true };
          return { ...c, flipped: false };
        });
      });
      setPicked([]);
      setTries((t) => t + 1);
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  useEffect(() => {
    if (answeredRef.current) return;
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      answeredRef.current = true;
      onAnswer(true, `Todos os pares encontrados em ${tries + 1} tentativas! ${explanation}`);
    }
  }, [cards, tries, explanation, onAnswer]);

  const flip = (id: number) => {
    if (disabled || picked.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;
    sfx.flip();
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setPicked((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-3">
      <p className="font-body text-sm text-muted-foreground">
        Toque duas cartas por vez. Forme pares conceito ↔ explicação.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => flip(c.id)}
            className={`aspect-[3/2] rounded-2xl border p-2 text-center font-body text-sm transition ${
              c.matched
                ? "border-codey-moss/40 bg-codey-moss/10 text-foreground"
                : c.flipped
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-transparent hover:border-primary/40"
            }`}
          >
            {c.flipped || c.matched ? c.label : "?"}
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------- MAZE ----------
type Dir = "up" | "down" | "left" | "right";

const DIR_DELTA: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export const MazeRunner = ({
  cols,
  rows,
  start,
  goal,
  walls,
  solution,
  explanation,
  companion,
  disabled,
  onAnswer,
}: {
  cols: number;
  rows: number;
  start: [number, number];
  goal: [number, number];
  walls: [number, number][];
  solution: Dir[];
  explanation: string;
  companion: Companion;
  disabled: boolean;
  onAnswer: AnswerFn;
}) => {
  const [moves, setMoves] = useState<Dir[]>([]);
  const [pos, setPos] = useState<[number, number]>(start);
  const [playing, setPlaying] = useState(false);

  const wallSet = useMemo(() => new Set(walls.map(([x, y]) => `${x},${y}`)), [walls]);

  const addMove = (d: Dir) => {
    if (disabled || playing) return;
    sfx.tap();
    setMoves((m) => [...m, d]);
  };

  const reset = () => {
    setMoves([]);
    setPos(start);
    setPlaying(false);
  };

  const run = async () => {
    if (playing || disabled) return;
    setPlaying(true);
    let cur: [number, number] = [...start] as [number, number];
    setPos(cur);
    for (const m of moves) {
      await new Promise((r) => setTimeout(r, 350));
      const [dx, dy] = DIR_DELTA[m];
      const next: [number, number] = [cur[0] + dx, cur[1] + dy];
      const outOfBounds = next[0] < 0 || next[0] >= cols || next[1] < 0 || next[1] >= rows;
      const hitWall = wallSet.has(`${next[0]},${next[1]}`);
      if (outOfBounds || hitWall) {
        setPlaying(false);
        onAnswer(false, `${companion.name} bateu em um obstáculo. Tente ajustar a sequência. ${explanation}`);
        return;
      }
      cur = next;
      setPos(cur);
      sfx.step();
    }
    await new Promise((r) => setTimeout(r, 200));
    setPlaying(false);
    if (cur[0] === goal[0] && cur[1] === goal[1]) {
      onAnswer(true, `${companion.name} chegou ao tesouro! ${explanation}`);
    } else {
      onAnswer(false, `Quase! ${companion.name} parou no caminho. ${explanation}`);
    }
  };

  return (
    <div className="space-y-3">
      <p className="font-body text-sm text-muted-foreground">
        Adicione as setas, na ordem, para guiar {companion.name} até o tesouro. Depois toque em "Executar".
      </p>
      <div
        className="grid gap-1 mx-auto bg-codey-cream/40 rounded-2xl p-3 border border-border"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(2rem, 1fr))`, maxWidth: `${cols * 56}px` }}
      >
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => {
            const isStart = start[0] === x && start[1] === y;
            const isGoal = goal[0] === x && goal[1] === y;
            const isWall = wallSet.has(`${x},${y}`);
            const isHere = pos[0] === x && pos[1] === y;
            return (
              <div
                key={`${x}-${y}`}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs relative ${
                  isWall ? "bg-foreground/40" : "bg-background border border-border"
                }`}
              >
                {isGoal && !isHere && <Trophy className="w-5 h-5 text-codey-amber" />}
                {isStart && !isHere && !isGoal && (
                  <span className="text-[10px] text-muted-foreground">início</span>
                )}
                <AnimatePresence>
                  {isHere && (
                    <motion.img
                      key="companion"
                      src={companion.img}
                      alt={companion.name}
                      className="w-3/4 h-3/4 object-contain absolute"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          }),
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background p-3">
        <p className="font-display text-xs text-muted-foreground mb-2">Sequência</p>
        <div className="flex flex-wrap gap-1 min-h-8">
          {moves.length === 0 && <span className="text-xs text-muted-foreground">vazia</span>}
          {moves.map((m, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-1"
            >
              {m === "up" && <ArrowUp className="w-3 h-3" />}
              {m === "down" && <ArrowDown className="w-3 h-3" />}
              {m === "left" && <ArrowLeft className="w-3 h-3" />}
              {m === "right" && <ArrowRight className="w-3 h-3" />}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button variant="outline" onClick={() => addMove("up")} disabled={disabled || playing}>
          <ArrowUp className="w-4 h-4" /> Cima
        </Button>
        <Button variant="outline" onClick={() => addMove("down")} disabled={disabled || playing}>
          <ArrowDown className="w-4 h-4" /> Baixo
        </Button>
        <Button variant="outline" onClick={() => addMove("left")} disabled={disabled || playing}>
          <ArrowLeft className="w-4 h-4" /> Esquerda
        </Button>
        <Button variant="outline" onClick={() => addMove("right")} disabled={disabled || playing}>
          <ArrowRight className="w-4 h-4" /> Direita
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="hero" onClick={run} disabled={disabled || playing || moves.length === 0}>
          <Play className="w-4 h-4" /> Executar
        </Button>
        <Button variant="outline" type="button" onClick={reset} disabled={disabled || playing}>
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </Button>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setMoves((m) => m.slice(0, -1))}
          disabled={disabled || playing || moves.length === 0}
        >
          <Trash2 className="w-4 h-4" /> Apagar último
        </Button>
        {/* avoid unused import warning when solution prop is unused at runtime */}
        <span className="sr-only">{solution.length} passos sugeridos</span>
      </div>
    </div>
  );
};

// ---------- BLOCK BUILDER ----------
export const BlockBuilder = ({
  palette,
  solution,
  explanation,
  disabled,
  onAnswer,
}: {
  palette: string[];
  solution: string[];
  explanation: string;
  disabled: boolean;
  onAnswer: AnswerFn;
}) => {
  const shuffled = useMemo(() => [...palette].sort(() => Math.random() - 0.5), [palette]);
  const [chosen, setChosen] = useState<string[]>([]);

  const remaining = shuffled.filter((b, i) => {
    // allow duplicate items by counting usage in chosen
    const total = shuffled.slice(0, i + 1).filter((x) => x === b).length;
    const used = chosen.filter((x) => x === b).length;
    return used < total;
  });

  const add = (b: string) => {
    if (disabled) return;
    setChosen((c) => [...c, b]);
  };

  const removeAt = (i: number) => {
    if (disabled) return;
    setChosen((c) => c.filter((_, idx) => idx !== i));
  };

  const reset = () => setChosen([]);

  const check = () => {
    const ok = chosen.length === solution.length && chosen.every((b, i) => b === solution[i]);
    onAnswer(ok, ok ? `Bloco perfeito! ${explanation}` : `Quase. Revise a ordem e os blocos escolhidos. ${explanation}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Puzzle className="w-4 h-4 text-primary" />
        <span>Toque nos blocos para empilhar. Alguns são pegadinhas — escolha só os úteis e na ordem certa.</span>
      </div>

      <div className="rounded-2xl border border-border bg-background p-3 min-h-24">
        <p className="font-display text-xs text-muted-foreground mb-2">Seu programa</p>
        {chosen.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">vazio — escolha blocos abaixo</p>
        ) : (
          <ol className="space-y-1">
            {chosen.map((b, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-2 py-1 font-mono text-xs">
                <span>{b}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-codey-coral"
                  aria-label="Remover bloco"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-border p-3">
        <p className="font-display text-xs text-muted-foreground mb-2">Blocos disponíveis</p>
        <div className="flex flex-wrap gap-2">
          {remaining.map((b, i) => (
            <button
              key={`${b}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => add(b)}
              className="rounded-lg border border-border bg-card px-2 py-1 font-mono text-xs hover:border-primary/60"
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="hero" onClick={check} disabled={disabled || chosen.length === 0}>
          <Sparkles className="w-4 h-4" /> Conferir
        </Button>
        <Button variant="outline" type="button" onClick={reset} disabled={disabled}>
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </Button>
      </div>
    </div>
  );
};
