import { describe, it, expect } from "vitest";
import { codeyIslands, codeyLessons, type Exercise } from "@/data/codeyContent";

/**
 * Confere que TODA atividade do jogo tem solução possível e está bem montada.
 * Uma atividade impossível é especialmente ruim para a criança: ela acerta e o jogo diz que errou.
 */

const all = codeyIslands.flatMap((isl) =>
  (codeyLessons[isl.id] ?? []).flatMap((lesson) =>
    lesson.exercises.map((ex, i) => ({ where: `${lesson.id} #${i + 1} (${ex.type})`, ex, islandId: isl.id, lesson })),
  ),
);

const countOf = (arr: string[], v: string) => arr.filter((x) => x === v).length;

// Crases do markdown precisam vir em pares, senão o código aparece quebrado na tela.
const textsOf = (ex: Exercise): string[] =>
  Object.values(ex).flatMap((v) => (typeof v === "string" ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []));

describe("conteúdo das lições", () => {
  it("toda ilha tem lições e os ids são únicos e do formato ilha-número", () => {
    const ids = codeyIslands.flatMap((isl) => (codeyLessons[isl.id] ?? []).map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const isl of codeyIslands) {
      const ls = codeyLessons[isl.id] ?? [];
      expect(ls.length, `ilha ${isl.id}`).toBeGreaterThan(0);
      ls.forEach((l) => expect(l.id.startsWith(`${isl.id}-`), l.id).toBe(true));
    }
  });

  it.each(all.map((a) => [a.where, a] as const))("%s está bem montada", (_w, { ex, where }) => {
    for (const t of textsOf(ex)) expect((t.match(/`/g) ?? []).length % 2, `${where}: crase sem par em "${t}"`).toBe(0);

    switch (ex.type) {
      case "multiple_choice":
        expect(ex.correctIndex).toBeGreaterThanOrEqual(0);
        expect(ex.correctIndex).toBeLessThan(ex.options.length);
        expect(ex.notes.length, "uma nota por opção").toBe(ex.options.length);
        break;
      case "fill_blank":
        expect(ex.options).toContain(ex.answer);
        break;
      case "reorder":
        expect(ex.items.length).toBeGreaterThanOrEqual(2);
        expect(new Set(ex.items).size, "itens repetidos deixam a ordem ambígua").toBe(ex.items.length);
        break;
      case "fill_code": {
        const gaps = ex.code.split("___").length - 1;
        expect(gaps, "lacunas no código = respostas").toBe(ex.blanks.length);
        for (const b of new Set(ex.blanks))
          expect(countOf(ex.options, b), `bloco "${b}" disponível vezes suficientes`).toBeGreaterThanOrEqual(countOf(ex.blanks, b));
        break;
      }
      case "bug_hunt":
        expect(ex.buggyIndex).toBeGreaterThanOrEqual(0);
        expect(ex.buggyIndex).toBeLessThan(ex.lines.length);
        expect(new Set(ex.lines).size, "linhas repetidas confundem qual é a errada").toBe(ex.lines.length);
        break;
      case "block_builder":
        for (const s of new Set(ex.solution))
          expect(countOf(ex.palette, s), `bloco "${s}" na paleta`).toBeGreaterThanOrEqual(countOf(ex.solution, s));
        break;
      case "maze": {
        const inside = ([x, y]: number[]) => x >= 0 && y >= 0 && x < ex.cols && y < ex.rows;
        const walls = new Set(ex.walls.map(([x, y]) => `${x},${y}`));
        expect(inside(ex.start) && inside(ex.goal)).toBe(true);
        expect(walls.has(ex.start.join(",")) || walls.has(ex.goal.join(","))).toBe(false);
        const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
        let cur = [...ex.start];
        for (const m of ex.solution) {
          cur = [cur[0] + d[m][0], cur[1] + d[m][1]];
          expect(inside(cur) && !walls.has(cur.join(",")), `${where}: solução bate em ${cur}`).toBe(true);
        }
        expect(cur, "a solução chega ao tesouro").toEqual(ex.goal);
        break;
      }
      case "style_match": {
        expect(new Set(ex.props.map((p) => p.prop)).size).toBe(ex.props.length);
        for (const p of ex.props) {
          expect(p.options, `${p.label}: resposta entre as opções`).toContain(p.answer);
          expect(new Set(p.options).size, `${p.label}: opções repetidas`).toBe(p.options.length);
          expect(p.options.length, `${p.label}: precisa de alternativa`).toBeGreaterThanOrEqual(2);
          expect(CSS_OK(p.prop, p.answer), `${p.prop}: ${p.answer} é CSS válido`).toBe(true);
        }
        break;
      }
      case "memory_match": {
        const labels = ex.pairs.flatMap((p) => [p.a, p.b]);
        expect(new Set(labels).size, "cartas com o mesmo texto confundem").toBe(labels.length);
        break;
      }
      case "wire_match":
        expect(new Set(ex.pairs.map((p) => p.left)).size).toBe(ex.pairs.length);
        expect(new Set(ex.pairs.map((p) => p.right)).size).toBe(ex.pairs.length);
        break;
      case "code_challenge":
        expect(ex.tests.length).toBeGreaterThan(0);
        break;
    }
  });
});

// Confere o valor de CSS com o próprio navegador simulado (jsdom): valor inválido é descartado.
function CSS_OK(prop: string, value: string) {
  const el = document.createElement("span");
  el.style.setProperty(prop, value);
  return el.style.getPropertyValue(prop) !== "";
}

describe("oficinas de desafios", () => {
  it("cada ilha ganhou uma oficina só com atividades dinâmicas", () => {
    const passivas = ["info", "multiple_choice", "true_false", "fill_blank"];
    for (const isl of codeyIslands) {
      const oficina = (codeyLessons[isl.id] ?? []).find((l) => l.title.startsWith("Oficina"));
      expect(oficina, `ilha ${isl.id}`).toBeTruthy();
      expect(oficina!.exercises.length).toBeGreaterThanOrEqual(5);
      oficina!.exercises.forEach((e) => expect(passivas).not.toContain(e.type));
    }
  });
});
