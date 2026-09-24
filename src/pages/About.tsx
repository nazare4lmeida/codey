import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Brain, Code2, Heart, Map, Monitor, Puzzle, Shield, Sparkles, Star, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleField from "@/components/ParticleField";
import AuroraBackground from "@/components/AuroraBackground";
import { codeyIslands } from "@/data/codeyContent";
import mascotImg from "@/assets/codey-mascot.webp";
import heroImg from "@/assets/hero-landscape.jpg";
import { getIslandImage } from "@/lib/islandImages";

const Section = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.section
    className="mb-12"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.section>
);



const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleField count={10} />
      <AuroraBackground variant="moss" />


      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>

        <Section>
          <div className="text-center mb-8">
            <motion.img
              src={mascotImg}
              alt="Codey"
              className="w-20 h-20 mx-auto mb-4"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
              <span className="text-gradient-codey">Codey</span>
            </h1>
            <p className="text-lg text-muted-foreground font-body">
              Game Design Document — A Jornada de Programação em Aquarela
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-border">
            <img src={heroImg} alt="Mundo aquarela de Codey" className="w-full h-64 object-cover" />
          </div>
        </Section>

        <Section delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10"><Star className="w-6 h-6 text-primary" /></div>
            <h2 className="text-2xl font-display font-bold text-foreground">1. Conceito Central</h2>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-3 font-body text-foreground">
            <p>
              <strong className="font-display">Codey</strong> é um jogo de aprendizagem de programação baseado em <strong>perguntas, respostas, lições curtas e desafios de código</strong>. A estrutura, conteúdo e ideia vêm do projeto Codey original: uma trilha Full-Stack JavaScript com ilhas, tesouros, joias, ranking e progresso salvo.
            </p>
            <p>
              O design é aquarela onírica: aquarela suave, mascote companheiro, mundos ilustrados, partículas lentas, cartões arredondados, tipografia acolhedora e feedback sem frustração.
            </p>
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <p className="text-sm italic text-muted-foreground">
                💡 O foco agora é aprender programação com desafios interativos, perguntas guiadas e apoio gentil do companheiro Codey.
              </p>
            </div>
          </div>
        </Section>

        <Section delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-codey-amber/20"><Puzzle className="w-6 h-6 text-codey-amber" /></div>
            <h2 className="text-2xl font-display font-bold text-foreground">2. Mecânicas Principais</h2>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: <BookOpen className="w-5 h-5 text-primary" />, title: "Lições Curtas", items: ["Explicações pequenas", "Conteúdo progressivo", "Exemplos de HTML, CSS, JS, React, Node e banco"] },
                { icon: <Brain className="w-5 h-5 text-codey-amber" />, title: "Perguntas e Respostas", items: ["Múltipla escolha", "Verdadeiro ou falso", "Complete a lacuna", "Organização de passos"] },
                { icon: <Code2 className="w-5 h-5 text-codey-lavender-deep" />, title: "Desafios de Código", items: ["Editor simples", "Testes automáticos", "Dicas sem punição", "Feedback explicativo"] },
                { icon: <Trophy className="w-5 h-5 text-codey-moss" />, title: "Gamificação Codey", items: ["12 ilhas", "Joias/XP", "Tesouros por marco", "Progresso por lição"] },
              ].map((item) => (
                <div key={item.title} className="bg-background rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">{item.icon}<h4 className="font-display font-semibold">{item.title}</h4></div>
                  <ul className="space-y-1">
                    {item.items.map((line) => <li key={line} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary">•</span>{line}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-codey-lavender/20"><Map className="w-6 h-6 text-codey-lavender-deep" /></div>
            <h2 className="text-2xl font-display font-bold text-foreground">3. Estrutura das Ilhas</h2>
          </div>
          <div className="space-y-4">
            {codeyIslands.map((island, index) => (
              <div key={island.id} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
                <img src={getIslandImage(island.id)} alt={island.name} loading="lazy" className="w-full h-36 object-cover" />
                <div className="p-5">
                  <p className="text-xs font-display font-semibold text-primary mb-1">{island.weeksLabel}</p>
                  <h4 className="font-display font-bold text-foreground text-lg mb-2">{island.id}. {island.name}</h4>
                  <p className="text-sm text-muted-foreground font-body mb-2">Perguntas, respostas e desafios sobre {island.focus}.</p>
                  <p className="text-xs text-codey-amber font-display">🏆 {island.treasureName}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-codey-coral/20"><User className="w-6 h-6 text-codey-coral" /></div>
            <h2 className="text-2xl font-display font-bold text-foreground">4. Perfil e Companheiro</h2>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 font-body text-foreground space-y-3">
            <p>O processo inicial mantém um formato acolhedor, mas troca a criação de avatar humano por uma escolha de <strong>companheiro Codey</strong>.</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Nome exibido no mapa</li>
              <li>• Companheiro animal que acompanha a jornada</li>
              <li>• Cor aquarela do companheiro</li>
              <li>• Estilo de apoio: dicas suaves, passo a passo, testar primeiro ou modo calmo</li>
            </ul>
          </div>
        </Section>

        <Section delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-codey-sky/20"><Monitor className="w-6 h-6 text-codey-sky" /></div>
            <h2 className="text-2xl font-display font-bold text-foreground">5. Especificações Técnicas</h2>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 font-body text-foreground">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><strong className="font-display">Formato:</strong> Web responsiva</p>
                <p><strong className="font-display">Frontend:</strong> React, Tailwind e Framer Motion</p>
                <p><strong className="font-display">Backend:</strong> Auth e progresso salvos no backend</p>
              </div>
              <div className="space-y-2">
                <p><strong className="font-display">Conteúdo:</strong> 12 ilhas e trilha Full-Stack JS</p>
                <p><strong className="font-display">Interações:</strong> quizzes, reordenação e código testável</p>
                <p><strong className="font-display">Acessibilidade:</strong> baixo estímulo e feedback gentil</p>
              </div>
            </div>
          </div>
        </Section>

        <Section delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-codey-amber/20"><Shield className="w-6 h-6 text-codey-amber" /></div>
            <h2 className="text-2xl font-display font-bold text-foreground">6. Diferencial e Acessibilidade</h2>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 grid md:grid-cols-2 gap-4">
            {[
              { icon: <Heart className="w-5 h-5 text-codey-coral" />, title: "Sem Frustração", desc: "Erro vira explicação curta, sem punição agressiva." },
              { icon: <Sparkles className="w-5 h-5 text-codey-amber" />, title: "Engajamento", desc: "Lições pequenas, recompensas frequentes e progresso visível." },
              { icon: <Brain className="w-5 h-5 text-primary" />, title: "Neurodivergência", desc: "Ritmo calmo, previsibilidade e estímulos visuais suaves." },
              { icon: <Code2 className="w-5 h-5 text-codey-lavender-deep" />, title: "Conteúdo Real", desc: "Trilha do Codey original, com fundamentos até deploy." },
            ].map((item) => (
              <div key={item.title} className="bg-background rounded-xl p-4 border border-border">
                {item.icon}
                <h4 className="font-display font-semibold text-sm mt-2 mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section delay={0.1}>
          <div className="text-center py-8">
            <Button variant="hero" size="xl" onClick={() => navigate("/login")}>
              <Sparkles className="w-5 h-5" /> Começar Codey
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default About;
