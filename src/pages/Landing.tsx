import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ParticleField from "@/components/ParticleField";
import heroImg from "@/assets/hero-landscape.jpg";
import mascotImg from "@/assets/codey-mascot.webp";
import { Sparkles, Code2, Star, Terminal, Braces, Heart } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleField count={30} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-32">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Codey - Mundos de programação"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background" />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Mascot */}
          <motion.img
            src={mascotImg}
            alt="Codey - seu companheiro de jornada"
            className="w-28 h-28 mx-auto mb-6"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <h1 className="text-5xl md:text-7xl font-display font-bold mb-4">
            <span className="text-gradient-codey">Codey</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-body mb-2">
            A Aventura de Aprender a Programar
          </p>
          <p className="text-base md:text-lg text-muted-foreground/80 font-body max-w-2xl mx-auto mb-10">
            Avance por ilhas aquarela, responda perguntas, rode desafios de
            código e aprenda programação no seu ritmo com o companheiro Codey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={() => navigate("/login")}>
              <Sparkles className="w-5 h-5" />
              Começar Jornada
            </Button>
            <Button variant="hero-outline" size="xl" onClick={() => navigate("/about")}>
              <Code2 className="w-5 h-5" />
              Conhecer o Jogo
            </Button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20 px-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {[
            {
              icon: <Terminal className="w-8 h-8 text-codey-turquoise" />,
              title: "12 Ilhas de Código",
              desc: "A trilha do Codey original: Web, HTML, CSS, Git, JavaScript, React, banco, Node, Express, testes e deploy.",
            },
            {
              icon: <Star className="w-8 h-8 text-codey-amber" />,
              title: "Companheiro Codey",
              desc: "Escolha quem acompanha sua jornada e o tipo de apoio que deixa as lições mais tranquilas.",
            },
            {
              icon: <Braces className="w-8 h-8 text-codey-lavender" />,
              title: "Perguntas e Código",
              desc: "Resolva quizzes, complete lacunas, organize passos e escreva funções com testes automáticos.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow duration-300"
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm font-body">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-border/40 bg-background/80 backdrop-blur-sm py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={mascotImg} alt="Codey" className="w-10 h-10" />
            <span className="font-display font-bold text-lg text-foreground">Codey</span>
          </div>
          <p className="text-sm text-muted-foreground text-center font-body">
            Feito com <Heart className="w-4 h-4 inline text-codey-coral fill-codey-coral" /> para aprender programação no seu ritmo.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground font-body">
            <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">
              Sobre
            </button>
            <button onClick={() => navigate("/login")} className="hover:text-foreground transition-colors">
              Entrar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
