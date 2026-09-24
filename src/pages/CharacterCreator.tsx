import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Heart, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ParticleField from "@/components/ParticleField";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { companionList as companions, preloadImage } from "@/lib/companions";
import { useCompanion } from "@/lib/companion-context";
import CompanionAvatar from "@/components/CompanionAvatar";
import { useShouldFloat } from "@/components/AnimatedCompanion";
import { sfx } from "@/lib/sound";
import { toast } from "sonner";
import forestImg from "@/assets/world-forest.jpg";

const companionColors = [
  { name: "Turquesa", className: "bg-codey-turquoise", value: 0 },
  { name: "Âmbar", className: "bg-codey-amber", value: 1 },
  { name: "Lavanda", className: "bg-codey-lavender", value: 2 },
  { name: "Musgo", className: "bg-codey-moss", value: 3 },
  { name: "Coral", className: "bg-codey-coral", value: 4 },
  { name: "Céu", className: "bg-codey-sky", value: 5 },
];

const supportStyles = [
  { icon: "💡", name: "Dicas suaves", desc: "Receber uma pista curta quando errar." },
  { icon: "🧩", name: "Passo a passo", desc: "Quebrar o problema em partes menores." },
  { icon: "🧪", name: "Testar primeiro", desc: "Ver exemplos antes de responder." },
  { icon: "🌿", name: "Modo calmo", desc: "Mais tempo, menos pressão e feedback tranquilo." },
];

const CharacterCreator = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { companionIndex, setCompanionIndex } = useCompanion();
  const [name, setName] = useState("");
  // Começa JÁ com o companheiro salvo (cache por usuário), sem pular da Vix para o certo.
  const [companion, setCompanion] = useState(companionIndex ?? 0);
  const floats = useShouldFloat(companions[companion]);
  const [color, setColor] = useState(0);
  const [support, setSupport] = useState(0);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Se a criança já mexeu em algo, a resposta do servidor não pode sobrescrever.
  const touched = useRef({ name: false, companion: false, color: false, support: false });

  useEffect(() => {
    companions.forEach((c) => preloadImage(c.img));
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
      return;
    }
    if (!user) return;
    let cancelled = false;
    supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setLoaded(true);
        if (!data) return;
        const t = touched.current;
        if (!t.name) setName(data.name || "");
        if (!t.companion && data.accessory >= 0 && data.accessory < companions.length) setCompanion(data.accessory);
        if (!t.color) setColor(data.outfit_color ?? 0);
        if (!t.support) setSupport(data.ability ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, navigate, user]);

  // Mantém a seleção coerente se o cache do provedor chegar depois do primeiro render.
  useEffect(() => {
    if (companionIndex != null && !touched.current.companion) setCompanion(companionIndex);
  }, [companionIndex]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("characters").upsert(
      {
        user_id: user.id,
        name: name || "Programador Codey",
        skin_color: 0,
        hair_color: companion,
        outfit_color: color,
        accessory: companion,
        ability: support,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar companheiro.");
      return;
    }
    setCompanionIndex(companion);
    sfx.complete();
    toast.success("Seu companheiro Codey está pronto! 💡");
    navigate("/hub");
  };

  const steps = ["Nome", "Companheiro", "Cor", "Apoio"];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ParticleField count={12} />
      <div className="absolute inset-0 z-0">
        <img src={forestImg} alt="Floresta aquarela do Codey" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/75 to-background" />
      </div>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-20">
        <Button variant="ghost" onClick={() => navigate("/hub")} className="mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>

        <motion.div
          className="bg-card/85 backdrop-blur-sm border border-border rounded-3xl p-6 md:p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <motion.div
              className="mx-auto mb-4 w-32 h-32 rounded-full bg-primary/10 border-4 border-border flex items-center justify-center relative overflow-hidden"
              animate={floats ? { y: [0, -8, 0] } : { y: 0 }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              <CompanionAvatar companion={companions[companion]} className="w-full h-full" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Escolha quem acompanha você
            </h1>
            <p className="font-body text-muted-foreground">
              O perfil agora é o processo de escolher um companheiro Codey, não criar avatar humano.
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-display font-semibold transition ${step === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {step === 0 && (
              <div className="space-y-4">
                <Label className="font-display text-foreground">Nome no Codey</Label>
                <Input
                  placeholder="Como quer aparecer no mapa?"
                  value={name}
                  onChange={(event) => {
                    touched.current.name = true;
                    setName(event.target.value);
                  }}
                  className="rounded-xl bg-background text-lg"
                />
              </div>
            )}

            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {companions.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      touched.current.companion = true;
                      setCompanion(index);
                      sfx.select();
                    }}
                    aria-pressed={companion === index}
                    className={`rounded-2xl border p-4 text-left transition ${companion === index ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}
                  >
                    <img src={item.img} alt={item.name} decoding="async" className="w-16 h-16 object-contain mx-auto" />
                    <h2 className="font-display font-bold text-foreground mt-2">{item.name}</h2>
                    <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {companionColors.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      touched.current.color = true;
                      setColor(index);
                      sfx.tap();
                    }}
                    className={`rounded-2xl border p-4 transition ${color === index ? "border-primary shadow-md scale-[1.02]" : "border-border bg-background hover:border-primary/50"}`}
                  >
                    <div className={`w-14 h-14 rounded-full mx-auto mb-2 ${item.className}`} />
                    <span className="font-display text-sm text-foreground">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {supportStyles.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      touched.current.support = true;
                      setSupport(index);
                      sfx.tap();
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${support === index ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}
                  >
                    <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                    <h2 className="font-display font-bold text-foreground mt-2">{item.name}</h2>
                    <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              Anterior
            </Button>
            {step < steps.length - 1 ? (
              <Button variant="hero" onClick={() => setStep(step + 1)}>
                <Sparkles className="w-4 h-4" /> Próximo
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSave} disabled={saving || !loaded}>
                <Check className="w-4 h-4" /> {saving ? "Salvando..." : !loaded ? "Carregando..." : "Entrar no mapa"}
              </Button>
            )}
          </div>
        </motion.div>

        <div className="mt-4 grid sm:grid-cols-3 gap-3 text-center">
          {["Perguntas guiadas", "Desafios de código", "Feedback gentil"].map((item, index) => (
            <div key={item} className="rounded-2xl bg-card/70 border border-border p-3 font-display text-sm text-muted-foreground">
              {index === 0 && <Heart className="w-4 h-4 inline mr-1 text-codey-coral" />}
              {index === 1 && <Star className="w-4 h-4 inline mr-1 text-codey-amber" />}
              {index === 2 && <Sparkles className="w-4 h-4 inline mr-1 text-primary" />}
              {item}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CharacterCreator;
