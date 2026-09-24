import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Code2, Heart, Lightbulb, Play, Sparkles, Star, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleField from "@/components/ParticleField";
import CompanionBuddy from "@/components/CompanionBuddy";
import { useAuth } from "@/lib/auth-context";
import { codeyIslands, findLesson, lessonsForIsland, type CodeyLesson, type Exercise } from "@/data/codeyContent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { randomFrom, type Companion } from "@/lib/companions";
import { useCompanion } from "@/lib/companion-context";
import { SUPPORT } from "@/lib/character-prefs";
import CompanionAvatar from "@/components/CompanionAvatar";
import { useShouldFloat } from "@/components/AnimatedCompanion";
import { lessonKey, loadLocalCompleted, markLessonComplete, retryPendingWhenOnline, syncCompleted } from "@/lib/progress";
import { sfx } from "@/lib/sound";
import { reactCompanion } from "@/lib/companion-reaction";
import { getIslandImage } from "@/lib/islandImages";
import { isIslandUnlocked } from "@/lib/islandUnlock";
import { BlockBuilder, BugHunt, MazeRunner, MemoryMatch, WireMatch } from "@/components/codey/InteractiveExercises";
import { FillCode } from "@/components/codey/FillCode";

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);

const markdownish = (text: string) =>
  escapeHtml(text)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code) => `<pre><code>${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

const CodeyWorld = () => {
  const { islandId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const id = Number(islandId || 1);
  const island = codeyIslands.find((item) => item.id === id) || codeyIslands[0];
  const lessons = lessonsForIsland(island.id);
  const [completed, setCompleted] = useState<Set<string>>(() => loadLocalCompleted(user?.id));
  const [selectedLesson, setSelectedLesson] = useState<CodeyLesson | null>(null);
  const image = getIslandImage(island.id);
  // Companheiro vem do provedor central (cache por usuário + servidor), não de uma busca local.
  const { companion } = useCompanion();
  const floats = useShouldFloat(companion);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, navigate, user]);

  useEffect(() => {
    // A gating de progressão é feita no WorldHub; se o usuário tentar acessar
    // a Ilha 1 sempre passa. Ilhas seguintes só chegam aqui via clique liberado.
    if (island.id > 1 && !isIslandUnlocked(island.id, loadLocalCompleted(user?.id))) {
      toast.info("Conclua a ilha anterior para liberar esta 🌿");
      navigate("/hub");
    }
  }, [island.id, navigate, user?.id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setCompleted(loadLocalCompleted(user.id));
    syncCompleted(user.id).then((merged) => {
      if (!cancelled) setCompleted(merged);
    });
    const stop = retryPendingWhenOnline(user.id);
    return () => {
      cancelled = true;
      stop();
    };
  }, [user]);

  useEffect(() => {
    setSelectedLesson(lessonId ? findLesson(island.id, lessonId) : null);
  }, [island.id, lessonId]);

  const markComplete = async (lesson: CodeyLesson) => {
    if (!user) return;
    const key = lessonKey(island.id, lesson.id);
    setCompleted((prev) => new Set(prev).add(key)); // otimista: aparece concluída na hora
    toast.success(`${lesson.title} concluída! ${island.treasureName}`);
    navigate(`/world/${island.id}`);
    // Grava local + fila pendente; se a internet falhar, reenvia depois (não perde progresso).
    const next = await markLessonComplete(user.id, key, lesson.xp);
    setCompleted((prev) => new Set([...prev, ...next]));
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ParticleField count={14} />
      <div className="absolute inset-0 z-0">
        <img src={image} alt={island.name} className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      </div>

      {selectedLesson ? (
        <LessonPlayer
          lesson={selectedLesson}
          islandName={island.name}
          islandId={island.id}
          companion={companion}
          onBack={() => navigate(`/world/${island.id}`)}
          onComplete={() => markComplete(selectedLesson)}
        />

      ) : (
        <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:py-8 pb-36 md:pb-40">
          <Button variant="ghost" onClick={() => navigate("/hub")} className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao mapa
          </Button>

          <motion.header
            className="grid md:grid-cols-[auto_1fr] gap-5 items-center bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-5 md:p-7 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div className="w-24 h-24 mx-auto" animate={floats ? { y: [0, -8, 0] } : { y: 0 }} transition={{ duration: 3.5, repeat: Infinity }}>
              <CompanionAvatar className="w-24 h-24" alt={`Companheiro ${companion.name}`} />
            </motion.div>
            <div>
              <p className="font-display text-sm text-primary font-semibold mb-1">{island.weeksLabel}</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">{island.name}</h1>
              <p className="font-body text-muted-foreground mb-3">Desafios de perguntas, respostas e código sobre {island.focus}.</p>
              <p className="font-display text-sm text-codey-amber">{island.treasureName}</p>
            </div>
          </motion.header>

          <div className="grid gap-4">
            {lessons.map((lesson, index) => {
              const key = lessonKey(island.id, lesson.id);
              const done = completed.has(key);
              return (
                <motion.button
                  key={lesson.id}
                  type="button"
                  onClick={() => {
                    sfx.tap();
                    navigate(`/world/${island.id}/lesson/${lesson.id}`);
                  }}
                  className="text-left bg-card/85 backdrop-blur-sm border border-border rounded-2xl p-5 transition-all hover:shadow-lg hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold ${done ? "bg-codey-moss/20 text-codey-moss" : "bg-primary/10 text-primary"}`}>
                      {done ? <Check className="w-6 h-6" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-lg font-bold text-foreground">{lesson.title}</h2>
                      <p className="font-body text-sm text-muted-foreground">{lesson.exercises.length} exercícios · perguntas, respostas e desafios de código</p>
                    </div>
                    <span className="font-display text-xs font-semibold text-codey-turquoise bg-codey-turquoise/10 rounded-full px-3 py-1">{done ? "concluída" : `+${lesson.xp} joias`}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </main>
      )}
      {!selectedLesson && <CompanionBuddy companion={companion} tipIntervalMs={75000} />}
    </div>
  );
};

const POINTS_PER_CORRECT = 10;
const BONUS_PER_HEART = 8;

const LessonPlayer = ({ lesson, islandName, islandId, companion, onBack, onComplete }: { lesson: CodeyLesson; islandName: string; islandId: number; companion: Companion; onBack: () => void; onComplete: () => void }) => {
  const { user } = useAuth();
  // Estilo de apoio escolhido no criador de personagem
  const { support } = useCompanion();
  const calmMode = support === SUPPORT.calmo; // sem corações: errar não tira nada
  const softHints = support === SUPPORT.dicas; // no erro, a dica aparece sozinha
  const [attemptKey, setAttemptKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [hearts, setHearts] = useState(5);
  const wrongStreak = useRef(0);
  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reaction, setReaction] = useState<{ mood: "celebrate" | "encourage"; text: string; key: number } | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const exercise = lesson.exercises[index];
  const progress = useMemo(() => Math.round((index / lesson.exercises.length) * 100), [index, lesson.exercises.length]);

  const restart = () => {
    setIndex(0);
    setHearts(5);
    wrongStreak.current = 0;
    setPoints(0);
    setCorrectCount(0);
    setFinished(false);
    setFeedback(null);
    setSaved(false);
    setStartedAt(Date.now());
    setAttemptKey((k) => k + 1);
  };

  const goNext = () => {
    sfx.tap();
    setFeedback(null);
    if (index >= lesson.exercises.length - 1) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  };

  const answer = (ok: boolean, text: string) => {
    if (ok) sfx.correct();
    else sfx.wrong();
    // companheiro animado: feliz no acerto; no erro, reação acolhedora (tontinho só no 2º erro seguido)
    reactCompanion(ok ? "acerto" : wrongStreak.current >= 1 ? "erro-seguido" : "erro");
    wrongStreak.current = ok ? 0 : wrongStreak.current + 1;
    const hint = (exercise as { hint?: string }).hint;
    const withHint = !ok && softHints && hint && !text.includes(hint) ? `${text}\n\n💡 Dica: ${hint}` : text;
    setFeedback({ ok, text: withHint });
    if (ok) {
      setPoints((p) => p + POINTS_PER_CORRECT);
      setCorrectCount((c) => c + 1);
    } else if (!calmMode) {
      setHearts((value) => Math.max(0, value - 1));
    }
    setReaction({
      mood: ok ? "celebrate" : "encourage",
      text: randomFrom(ok ? companion.celebrate : companion.encourage),
      key: Date.now(),
    });
  };

  const totalQ = lesson.exercises.filter((e) => e.type !== "info").length || lesson.exercises.length;
  const heartBonus = hearts * BONUS_PER_HEART;
  const xpBonus = lesson.xp;
  const total = points + heartBonus + xpBonus;
  const accuracy = totalQ ? Math.round((correctCount / totalQ) * 100) : 100;
  const stars = hearts >= 4 ? 3 : hearts >= 2 ? 2 : 1;
  // Mensagem de comemoração sorteada UMA vez por conclusão (antes mudava a cada re-render,
  // reiniciando o balão do companheiro quando o "✓ salvo" aparecia).
  const [finishMessage, setFinishMessage] = useState("");

  useEffect(() => {
    if (!finished) return;
    setFinishMessage(randomFrom(companion.celebrate));
    sfx.complete();
    setTimeout(() => reactCompanion("fim"), 150); // espera a tela de conclusão montar
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sorteia só quando a fase termina
  }, [finished]);

  useEffect(() => {
    if (!finished || saved || !user) return;
    const persist = async () => {
      setSaved(true);
      await supabase.from("lesson_attempts").insert({
        user_id: user.id,
        island_id: String(islandId),
        lesson_id: lesson.id,
        score: total,
        hearts_left: hearts,
        correct_count: correctCount,
        total: totalQ,
        stars,
        duration_seconds: Math.round((Date.now() - startedAt) / 1000),
        completed: true,
      });
      const { grantBadge, checkPointBadges, checkStreakBadges } = await import("@/lib/badges");
      await grantBadge(user.id, "first_lesson");
      if (correctCount === totalQ && totalQ > 0) await grantBadge(user.id, "perfect_lesson");
      const { data: tp } = await supabase.rpc("user_total_points", { _user_id: user.id });
      const { data: st } = await supabase.rpc("user_streak_days", { _user_id: user.id });
      await checkPointBadges(user.id, (tp as number) || 0);
      await checkStreakBadges(user.id, (st as number) || 0);
    };
    persist();
  }, [finished, saved, user, islandId, lesson.id, total, hearts, correctCount, totalQ, stars, startedAt]);

  if (finished) {
    return (
      <main className="relative z-10 min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 pl-3 sm:pl-4 md:pl-6 pr-[8.5rem] sm:pr-[11rem] py-3 sm:py-4 bg-card/85 backdrop-blur-sm border-b border-border">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Fechar lição">
            <X className="w-5 h-5" />
          </Button>
          <p className="font-display text-sm text-muted-foreground truncate">Fase concluída · {lesson.title}</p>
        </header>
        <section className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 pb-36 md:pb-44">
          <motion.div
            className="bg-card/95 backdrop-blur-sm border border-border rounded-3xl p-6 md:p-10 shadow-lg text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div initial={{ rotate: -8, scale: 0.7 }} animate={{ rotate: [0, 360], scale: 1 }} transition={{ type: "spring", duration: 1.2 }}>
              <Trophy className="w-16 h-16 mx-auto text-codey-amber" />
            </motion.div>
            <h2 className="font-display text-3xl font-bold text-foreground mt-3">Fase concluída!</h2>
            <p className="font-body text-muted-foreground mt-1">{islandName}</p>

            <div className="flex justify-center gap-2 mt-5" aria-label={`${stars} de 3 estrelas`}>
              {[0, 1, 2].map((i) => (
                <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + i * 0.15, type: "spring" }}>
                  <Star className={`w-9 h-9 ${i < stars ? "fill-codey-amber text-codey-amber" : "text-muted-foreground/30"}`} />
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 text-left">
              <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3">
                <p className="font-display text-xs text-primary">Pontos</p>
                <p className="font-display text-2xl font-bold text-foreground">{points}</p>
              </div>
              <div className="rounded-2xl bg-codey-coral/10 border border-codey-coral/20 p-3">
                <p className="font-display text-xs text-codey-coral">{calmMode ? "Ritmo" : "Vidas"}</p>
                <p className="font-display text-2xl font-bold text-foreground">{calmMode ? "🌿 calmo" : `${hearts}/5`}</p>
              </div>
              <div className="rounded-2xl bg-codey-turquoise/10 border border-codey-turquoise/20 p-3">
                <p className="font-display text-xs text-codey-turquoise">Acertos</p>
                <p className="font-display text-2xl font-bold text-foreground">{accuracy}%</p>
              </div>
              <div className="rounded-2xl bg-codey-amber/10 border border-codey-amber/30 p-3">
                <p className="font-display text-xs text-codey-amber">Bônus joias</p>
                <p className="font-display text-2xl font-bold text-foreground">+{xpBonus + heartBonus}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background p-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-codey-amber" />
              <p className="font-display text-lg text-foreground">
                Total: <span className="font-bold">{total}</span> pontos {saved && <span className="text-xs text-muted-foreground ml-2">✓ salvo</span>}
              </p>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" size="lg" onClick={restart}>
                🔁 Refazer desafio
              </Button>
              <Button variant="hero" size="lg" onClick={onComplete}>
                Voltar ao mapa
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Refazer não apaga seu histórico — cria uma nova tentativa.</p>
          </motion.div>
        </section>
        <CompanionBuddy companion={companion} mood="celebrate" message={finishMessage} tipsEnabled={false} />
      </main>
    );
  }

  return (
    <main key={attemptKey} className="relative z-10 min-h-screen flex flex-col">

      <header className="sticky top-0 z-20 flex items-center gap-3 pl-3 sm:pl-4 md:pl-6 pr-[8.5rem] sm:pr-[11rem] py-3 sm:py-4 bg-card/85 backdrop-blur-sm border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Fechar lição">
          <X className="w-5 h-5" />
        </Button>
        <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary font-display text-sm font-semibold" aria-label={`${points} pontos`}>
          <Sparkles className="w-4 h-4" /> {points}
        </div>
        {calmMode ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-codey-moss/15 text-codey-moss font-display text-xs sm:text-sm font-semibold" title="Modo calmo: errar não tira nada">
            🌿 <span className="hidden sm:inline">Modo calmo</span>
          </div>
        ) : (
          <div className="flex gap-1 text-codey-coral" aria-label={`${hearts} vidas restantes`}>
            {Array.from({ length: 5 }).map((_, i) => <Heart key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < hearts ? "fill-current" : "opacity-25"}`} />)}
          </div>
        )}
      </header>

      <section className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10 pb-36 md:pb-44">
        <motion.div
          key={`${lesson.id}-${index}`}
          className="bg-card/90 backdrop-blur-sm border border-border rounded-3xl p-6 md:p-8 shadow-lg"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CompanionAvatar className="w-14 h-14 flex-shrink-0" alt={`${companion.name} acompanhando a lição`} />
            <div>
              <p className="font-display text-xs text-primary font-semibold">{islandName} · {companion.name}</p>
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">{lesson.title}</h1>
            </div>
          </div>


          <ExerciseView exercise={exercise} onAnswer={answer} feedback={feedback} onContinue={goNext} companion={companion} />
        </motion.div>
      </section>

      <CompanionBuddy companion={companion} mood={reaction?.mood} message={reaction?.text} reactionKey={reaction?.key} tipIntervalMs={60000} />
    </main>
  );
};

const ExerciseView = ({ exercise, onAnswer, feedback, onContinue, companion }: { exercise: Exercise; onAnswer: (ok: boolean, text: string) => void; feedback: { ok: boolean; text: string } | null; onContinue: () => void; companion: Companion }) => {
  const [order, setOrder] = useState<string[]>([]);
  const [code, setCode] = useState(exercise.type === "code_challenge" ? exercise.starterCode : "");
  const disabled = !!feedback;

  const shuffledReorder = useMemo(
    () => (exercise.type === "reorder" ? [...exercise.items].sort(() => Math.random() - 0.5) : []),
    [exercise],
  );

  useEffect(() => {
    setOrder([]);
    setCode(exercise.type === "code_challenge" ? exercise.starterCode : "");
  }, [exercise]);

  const checkCode = (ex: Extract<Exercise, { type: "code_challenge" }>) => {
    try {
      const results = ex.tests.map((test) => Function(`${code}; return (${test.expr});`)());
      const ok = results.every(Boolean);
      onAnswer(ok, ok ? "Todos os testes passaram. Código funcionando!" : `Ainda falta ajustar: ${ex.hint}`);
    } catch (error) {
      onAnswer(false, error instanceof Error ? error.message : ex.hint);
    }
  };

  return (
    <div className="space-y-5">
      {exercise.type === "info" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">Explicação</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.title}</h2>
          <div className="font-body text-muted-foreground leading-relaxed prose-codey" dangerouslySetInnerHTML={{ __html: `<p>${markdownish(exercise.body)}</p>` }} />
          <Button variant="hero" size="lg" onClick={onContinue} className="w-full sm:w-auto">Continuar</Button>
        </>
      )}

      {exercise.type === "multiple_choice" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">Escolha uma resposta</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.question}</h2>
          <div className="grid gap-3">
            {exercise.options.map((option, i) => (
              <button key={option} disabled={disabled} onClick={() => onAnswer(i === exercise.correctIndex, exercise.notes[i === exercise.correctIndex ? exercise.correctIndex : i])} className="rounded-2xl border border-border bg-background p-4 text-left font-body text-foreground transition hover:border-primary/60 disabled:opacity-80">
                <span className="font-display text-primary mr-3">{String.fromCharCode(65 + i)}</span>{option}
              </button>
            ))}
          </div>
        </>
      )}

      {exercise.type === "fill_blank" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">Complete</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <div className="grid gap-3">
            {exercise.options.map((option, i) => (
              <button key={option} disabled={disabled} onClick={() => onAnswer(option === exercise.answer, exercise.notes[i])} className="rounded-2xl border border-border bg-background p-4 text-left font-body text-foreground transition hover:border-primary/60 disabled:opacity-80">
                <span className="font-display text-primary mr-3">{String.fromCharCode(65 + i)}</span>{option}
              </button>
            ))}
          </div>
        </>
      )}

      {exercise.type === "true_false" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">Verdadeiro ou falso?</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.statement}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[{ label: "Verdadeiro", value: true }, { label: "Falso", value: false }].map((item) => (
              <button key={item.label} disabled={disabled} onClick={() => onAnswer(item.value === exercise.answer, item.value === exercise.answer ? exercise.correctNote : exercise.wrongNote)} className="rounded-2xl border border-border bg-background p-5 font-display font-semibold text-foreground transition hover:border-primary/60 disabled:opacity-80">
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {exercise.type === "reorder" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">{exercise.title}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <div className="rounded-2xl bg-background border border-border p-3 min-h-16">
            <p className="font-display text-xs text-muted-foreground mb-2">Sua ordem</p>
            <div className="flex flex-wrap gap-2">
              {order.map((item, i) => <span key={`${item}-${i}`} className="rounded-full bg-primary/10 text-primary font-body text-sm px-3 py-1">{i + 1}. {item}</span>)}
            </div>
          </div>
          <div className="grid gap-2">
            {shuffledReorder.filter((item) => !order.includes(item)).map((item) => (
              <button key={item} disabled={disabled} onClick={() => setOrder([...order, item])} className="rounded-xl border border-border bg-background p-3 text-left font-body hover:border-primary/60 disabled:opacity-60">{item}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="hero" disabled={disabled || order.length !== exercise.items.length} onClick={() => onAnswer(JSON.stringify(order) === JSON.stringify(exercise.items), exercise.explanation)}>
              Conferir ordem
            </Button>
            <Button variant="outline" type="button" disabled={disabled || order.length === 0} onClick={() => setOrder([])}>
              Reiniciar
            </Button>
          </div>
        </>
      )}

      {exercise.type === "code_challenge" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">Desafio de código</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.title}</h2>
          <div className="font-body text-muted-foreground leading-relaxed prose-codey" dangerouslySetInnerHTML={{ __html: `<p>${markdownish(exercise.prompt)}</p>` }} />
          <CodeEditor value={code} onChange={setCode} />
          <div className="flex flex-wrap gap-2">
            <Button variant="hero" onClick={() => checkCode(exercise)} disabled={disabled}>
              <Play className="w-4 h-4" /> Rodar testes
            </Button>
            <HintButton hint={exercise.hint} />
          </div>
        </>
      )}

      {exercise.type === "wire_match" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">{exercise.title}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <WireMatch pairs={exercise.pairs} explanation={exercise.explanation} disabled={disabled} onAnswer={onAnswer} />
        </>
      )}

      {exercise.type === "bug_hunt" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">{exercise.title}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <BugHunt
            lines={exercise.lines}
            buggyIndex={exercise.buggyIndex}
            explanation={exercise.explanation}
            hint={exercise.hint}
            language={exercise.language}
            disabled={disabled}
            onAnswer={onAnswer}
          />
        </>
      )}

      {exercise.type === "memory_match" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">{exercise.title}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <MemoryMatch pairs={exercise.pairs} explanation={exercise.explanation} disabled={disabled} onAnswer={onAnswer} />
        </>
      )}

      {exercise.type === "maze" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">{exercise.title}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <MazeRunner
            cols={exercise.cols}
            rows={exercise.rows}
            start={exercise.start}
            goal={exercise.goal}
            walls={exercise.walls}
            solution={exercise.solution}
            explanation={exercise.explanation}
            companion={companion}
            disabled={disabled}
            onAnswer={onAnswer}
          />
        </>
      )}

      {exercise.type === "block_builder" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">{exercise.title}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <BlockBuilder palette={exercise.palette} solution={exercise.solution} explanation={exercise.explanation} disabled={disabled} onAnswer={onAnswer} />
        </>
      )}

      {exercise.type === "fill_code" && (
        <>
          <p className="font-display text-sm text-primary font-semibold">{exercise.title}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{exercise.prompt}</h2>
          <FillCode
            language={exercise.language}
            code={exercise.code}
            blanks={exercise.blanks}
            options={exercise.options}
            explanation={exercise.explanation}
            disabled={disabled}
            onAnswer={onAnswer}
          />
        </>
      )}

      {feedback && (
        <motion.div className={`rounded-2xl border p-4 ${feedback.ok ? "border-codey-moss/30 bg-codey-moss/10" : "border-codey-coral/30 bg-codey-coral/10"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-3">
            {feedback.ok ? <Check className="w-5 h-5 text-codey-moss mt-0.5" /> : <Lightbulb className="w-5 h-5 text-codey-coral mt-0.5" />}
            <div className="flex-1">
              <p className="font-display font-semibold text-foreground">{feedback.ok ? "Boa!" : "Quase. Vamos com calma."}</p>
              <p className="font-body text-sm text-muted-foreground whitespace-pre-line">{feedback.text}</p>
            </div>
          </div>
          <Button variant="hero" className="mt-4" onClick={onContinue}>
            <Sparkles className="w-4 h-4" /> Continuar
          </Button>
        </motion.div>
      )}
    </div>
  );
};

const CodeEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const lines = value.split("\n");
  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-2 font-mono text-xs text-slate-500">script.js</span>
      </div>
      <div className="flex font-mono text-sm">
        <div aria-hidden className="select-none py-3 px-2 text-right text-slate-400 bg-slate-50 border-r border-slate-200 min-w-10">
          {lines.map((_, i) => <div key={i} className="leading-6">{i + 1}</div>)}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 min-h-56 p-3 leading-6 bg-white text-slate-800 outline-none resize-y"
        />
      </div>
    </div>
  );
};

const HintButton = ({ hint }: { hint: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" type="button" onClick={() => setOpen((v) => !v)}>
        <Lightbulb className="w-4 h-4" /> {open ? "Ocultar dica" : "Ver dica"}
      </Button>
      {open && (
        <div className="basis-full mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 font-body text-sm text-amber-900">
          💡 {hint}
        </div>
      )}
    </>
  );
};

export default CodeyWorld;
