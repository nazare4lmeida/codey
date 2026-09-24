import { describe, it, expect } from "vitest";
import { ANIMATIONS, getAnimation, pickClip, sheetUrl, type ClipName } from "@/lib/companionAnimations";
import { adminCompanion, companionList } from "@/lib/companions";
import { onCompanionReaction, reactCompanion } from "@/lib/companion-reaction";

describe("escolha da emoção", () => {
  const vix = ANIMATIONS.vix;
  const brasa = ANIMATIONS.brasa;

  it("acerto e fim de lição → feliz", () => {
    expect(pickClip(vix, "acerto")).toBe("feliz");
    expect(pickClip(brasa, "fim")).toBe("feliz");
  });

  it("erro → pensando; sem pensando, cai para calminho", () => {
    expect(pickClip(vix, "erro")).toBe("pensando");
    expect(pickClip(brasa, "erro")).toBe("calminho");
  });

  it("2º erro seguido → tonto; sem tonto, reação de erro normal", () => {
    expect(pickClip(vix, "erro-seguido")).toBe("tonto");
    expect(pickClip(brasa, "erro-seguido")).toBe("calminho");
  });

  it("'triste' nunca é escolhido automaticamente", () => {
    for (const anim of Object.values(ANIMATIONS))
      for (const r of ["acerto", "erro", "erro-seguido", "fim"] as const) expect(pickClip(anim, r)).not.toBe("triste");
  });
});

describe("registro de animações", () => {
  it("todo companheiro com animação existe no catálogo (ou é a Lily do admin), e o Codey segue estático", () => {
    const ids = [...companionList.map((c) => c.id), adminCompanion.id];
    Object.keys(ANIMATIONS).forEach((id) => expect(ids).toContain(id));
    expect(getAnimation("codey")).toBeNull();
  });

  it("cada emoção registrada tem a folha de quadros correspondente", () => {
    for (const [id, anim] of Object.entries(ANIMATIONS))
      for (const clip of Object.keys(anim) as ClipName[]) expect(sheetUrl(id, clip), `${id}-${clip}`).toBeTruthy();
  });

  it("só o 'parado' fica em loop", () => {
    for (const anim of Object.values(ANIMATIONS))
      for (const [clip, meta] of Object.entries(anim)) expect(meta!.loop).toBe(clip === "parado");
  });
});

describe("Lily (admin)", () => {
  it("não aparece na escolha de companheiro da criança", () => {
    expect(companionList.map((c) => c.id)).not.toContain("lily");
  });

  it("tem parado em loop e as emoções do clique", () => {
    const lily = getAnimation("lily")!;
    expect(lily.parado.loop).toBe(true);
    expect(lily.pensando).toBeTruthy();
    expect(lily.assustada).toBeTruthy();
  });

  it("nos eventos da lição, nunca usa triste nem assustada", () => {
    const lily = getAnimation("lily")!;
    for (const r of ["acerto", "erro", "erro-seguido", "fim"] as const) {
      expect(pickClip(lily, r)).not.toBe("triste");
      expect(pickClip(lily, r)).not.toBe("assustada");
    }
  });
});

describe("canal de reações", () => {
  it("entrega a reação a quem está ouvindo e para ao cancelar", () => {
    const got: string[] = [];
    const off = onCompanionReaction((r) => got.push(r));
    reactCompanion("acerto");
    off();
    reactCompanion("erro");
    expect(got).toEqual(["acerto"]);
  });
});
