import { Link, useNavigate } from "react-router-dom";
import { Flame, LogOut, Moon, Sparkles, Sun, Trophy, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useStats } from "@/hooks/useStats";
import mascotImg from "@/assets/codey-mascot.webp";
import SoundControl from "@/components/SoundControl";

const AppHeader = ({ title = "Mapa das 12 Ilhas" }: { title?: string }) => {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { stats } = useStats();
  const navigate = useNavigate();

  return (
    <header className="relative z-10 flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-border bg-card/70 backdrop-blur-sm">
      <Link to="/hub" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition">
        <img src={mascotImg} alt="Codey" className="w-9 h-9 flex-shrink-0" />
        <div className="min-w-0 hidden sm:block">
          <h2 className="font-display font-bold text-foreground text-base leading-tight truncate">Codey</h2>
          <p className="text-xs text-muted-foreground font-body truncate">{title}</p>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-display text-sm font-semibold"
          title="Pontos totais"
        >
          <Sparkles className="w-4 h-4" />
          <span>{stats.totalPoints}</span>
        </div>
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-codey-amber/15 text-codey-amber font-display text-sm font-semibold"
          title="Dias seguidos praticando"
        >
          <Flame className="w-4 h-4" />
          <span>{stats.streak}</span>
        </div>
        <div
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-codey-lavender/20 text-codey-lavender-deep font-display text-sm font-semibold"
          title="Nível"
        >
          <Trophy className="w-4 h-4" />
          <span>Nv {stats.level}</span>
        </div>

        <SoundControl className="bg-transparent shadow-none" />
        <Button variant="ghost" size="icon" onClick={() => navigate("/ranking")} title="Ranking semanal">
          <Trophy className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/amigos")} title="Amigos">
          <Users className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/perfil")} title="Meu perfil">
          <User className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} title="Alternar tema">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            await logout();
            navigate("/");
          }}
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
