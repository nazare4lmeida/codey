import { Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/lib/theme-context";
import SoundControl from "@/components/SoundControl";

/**
 * Floating theme toggle used on pages without AppHeader.
 * Soft, unobtrusive, respects the aquarela palette.
 */
const ThemeToggle = ({ className = "", inline = false }: { className?: string; inline?: boolean }) => {
  const { theme, toggle } = useTheme();
  const base = inline
    ? "relative w-9 h-9 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition flex items-center justify-center"
    : "fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-card transition flex items-center justify-center shadow-sm";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      className={`${base} ${className}`}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

/**
 * Global mount: som + tema, em todas as rotas EXCETO as que já mostram o
 * AppHeader (que tem os próprios controles).
 */
const ROUTES_WITH_APP_HEADER = ["/hub", "/perfil", "/amigos", "/ranking", "/admin"];

export const GlobalThemeToggle = () => {
  const location = useLocation();
  if (ROUTES_WITH_APP_HEADER.includes(location.pathname)) return null;
  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      <SoundControl />
      <ThemeToggle className="!static" />
    </div>
  );
};

export default ThemeToggle;

