import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import mascotImg from "@/assets/codey-mascot.webp";
import ParticleField from "@/components/ParticleField";
import { toast } from "sonner";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import AuroraBackground from "@/components/AuroraBackground";


const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          toast.error("Por favor, insira seu nome de programador!");
          return;
        }
        const result = await signup(name, email, password);
        if (result.ok) {
          toast.success("Bem-vindo ao Codey, programador! 💡");
          navigate("/character");
        } else {
          toast.error(result.error || "Erro ao criar conta.");
        }
      } else {
        const result = await login(email, password);
        if (result.ok) {
          toast.success("Bem-vindo de volta! 💡");
          // Se ainda não escolheu o companheiro Codey, manda para o processo
          const { data: sess } = await supabase.auth.getUser();
          const uid = sess.user?.id;
          if (uid) {
            const { data: ch } = await supabase
              .from("characters")
              .select("id")
              .eq("user_id", uid)
              .maybeSingle();
            navigate(ch ? "/hub" : "/character");
          } else {
            navigate("/hub");
          }
        } else {
          toast.error(result.error || "Email ou senha incorretos.");
        }
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-x-hidden">
      <ParticleField count={15} />
      <AuroraBackground variant="lavender" />


      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-8 shadow-lg">
          <motion.img
            src={mascotImg}
            alt="Codey"
            className="w-20 h-20 mx-auto mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <h1 className="text-2xl font-display font-bold text-center text-foreground mb-1">
            {isSignup ? "Criar Conta" : "Entrar no Codey"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6 font-body">
            {isSignup
              ? "Prepare-se para aprender a programar! 💡"
              : "Seus mundos de código estão te esperando 🌍"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="name" className="text-foreground font-display text-sm">
                  Nome de Programador
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome de herói..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 rounded-xl bg-background border-border"
                  required
                />
              </motion.div>
            )}

            <div>
              <Label htmlFor="email" className="text-foreground font-display text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 rounded-xl bg-background border-border"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground font-display text-sm">
                Senha
              </Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 rounded-xl bg-background border-border"
                required
                minLength={6}
              />
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSignup ? (
                <>
                  <UserPlus className="w-4 h-4" /> Criar Conta
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline font-body"
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup
                ? "Já tem uma conta? Entrar"
                : "Não tem conta? Criar uma agora"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
