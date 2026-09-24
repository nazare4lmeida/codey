import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnswerFn = (ok: boolean, text: string) => void;

export type StyleProp = {
  /** propriedade CSS como se escreve no CSS (ex.: "background-color") */
  prop: string;
  /** nome amigável mostrado na tela (ex.: "Cor de fundo") */
  label: string;
  options: string[];
  answer: string;
};

export type StyleElement = "button" | "card" | "text" | "badge";

/** Aparência básica de cada tipo de elemento (fica igual no modelo e no da criança). */
const ELEMENT_BASE: Record<StyleElement, CSSProperties> = {
  button: { padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 16, border: "2px solid transparent" },
  card: { padding: "16px 18px", borderRadius: 12, width: 190, fontSize: 15, lineHeight: 1.4, border: "2px solid transparent" },
  text: { fontSize: 20, fontWeight: 700 },
  badge: { padding: "4px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "2px solid transparent" },
};

const toCamel = (prop: string) => prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

const styleFrom = (props: StyleProp[], values: (string | null)[]): CSSProperties => {
  const s: Record<string, string> = {};
  props.forEach((p, i) => {
    const v = values[i];
    if (v) s[toCamel(p.prop)] = v;
  });
  return s as CSSProperties;
};

const isColorProp = (prop: string) => /color|background/.test(prop);

/**
 * "Estilize igual ao modelo": a criança escolhe valores de CSS (cores, arredondamento, tamanho...)
 * e vê o próprio elemento mudar na hora, ao lado do modelo. O CSS vai sendo escrito embaixo.
 * As prévias ficam num "papel" claro fixo, como uma página de verdade, nos dois temas do jogo.
 */
export const StyleMatch = ({
  element,
  label,
  selector,
  props,
  explanation,
  disabled,
  onAnswer,
}: {
  element: StyleElement;
  label: string;
  selector: string;
  props: StyleProp[];
  explanation: string;
  disabled: boolean;
  onAnswer: AnswerFn;
}) => {
  const [values, setValues] = useState<(string | null)[]>(() => props.map(() => null));
  const key = useMemo(() => props.map((p) => p.prop + p.answer).join("|"), [props]);

  useEffect(() => {
    setValues(props.map(() => null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia ao trocar de exercício
  }, [key]);

  const target = styleFrom(
    props,
    props.map((p) => p.answer),
  );
  const mine = styleFrom(props, values);
  const allChosen = values.every((v) => v !== null);
  const untouched = values.every((v) => v === null);

  const choose = (i: number, v: string) => {
    if (disabled) return;
    setValues((prev) => prev.map((old, j) => (j === i ? v : old)));
  };

  const check = () => {
    const wrong = props.filter((p, i) => values[i] !== p.answer).map((p) => p.label.toLowerCase());
    if (wrong.length === 0) {
      onAnswer(true, `Ficou igualzinho ao modelo! ${explanation}`);
    } else {
      const list = wrong.length === 1 ? wrong[0] : `${wrong.slice(0, -1).join(", ")} e ${wrong[wrong.length - 1]}`;
      onAnswer(false, `Compare com o modelo: ${list} ainda ${wrong.length === 1 ? "está diferente" : "estão diferentes"}. ${explanation}`);
    }
  };

  const Preview = ({ style, title, pending }: { style: CSSProperties; title: string; pending?: boolean }) => (
    <figure className="flex-1 min-w-[150px] m-0">
      <figcaption className="font-display text-xs text-muted-foreground mb-1.5">{title}</figcaption>
      <div className="rounded-xl border border-slate-300 bg-white h-36 flex items-center justify-center p-3 overflow-hidden">
        <span
          style={{ ...ELEMENT_BASE[element], ...style }}
          className={cn(
            "inline-block text-center transition-all duration-300",
            pending && element !== "text" && "outline-2 outline-dashed outline-slate-300",
          )}
        >
          {label}
        </span>
      </div>
    </figure>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Palette className="w-4 h-4 text-primary" />
        <span>Escolha os estilos até o seu ficar igual ao modelo.</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Preview style={target} title="Modelo" />
        <Preview style={mine} title="O seu" pending={untouched} />
      </div>

      {/* O CSS sendo escrito conforme a escolha */}
      <div className="rounded-xl border border-slate-300 bg-white overflow-x-auto font-mono text-sm">
        <pre className="p-3 text-slate-800 leading-6 m-0" aria-label="CSS que você está montando">
          {`${selector} {\n`}
          {props.map((p, i) => (
            <span key={p.prop}>
              {"  "}
              {p.prop}:{" "}
              <span className={values[i] ? "text-teal-700 font-semibold" : "text-slate-400"}>{values[i] ?? "___"}</span>;{"\n"}
            </span>
          ))}
          {"}"}
        </pre>
      </div>

      <div className="space-y-3">
        {props.map((p, i) => (
          <div key={p.prop} role="group" aria-label={p.label}>
            <p className="font-display text-sm font-semibold text-foreground mb-1.5">{p.label}</p>
            <div className="flex flex-wrap gap-2">
              {p.options.map((opt) => {
                const on = values[i] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={disabled}
                    aria-pressed={on}
                    onClick={() => choose(i, opt)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-xs transition",
                      on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card hover:border-primary/60",
                      "disabled:opacity-50",
                    )}
                  >
                    {isColorProp(p.prop) && (
                      <span aria-hidden className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" style={{ background: opt }} />
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="hero" onClick={check} disabled={disabled || !allChosen}>
          <Check className="w-4 h-4" /> Conferir estilo
        </Button>
        <Button variant="outline" type="button" onClick={() => setValues(props.map(() => null))} disabled={disabled || untouched}>
          <RotateCcw className="w-4 h-4" /> Recomeçar
        </Button>
      </div>
    </div>
  );
};

export default StyleMatch;
