import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { GlobalThemeToggle } from "./components/ThemeToggle";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/lib/auth-context";
import { CompanionProvider } from "@/lib/companion-context";
import { ThemeProvider } from "@/lib/theme-context";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import WorldHub from "./pages/WorldHub";
import CodeyWorld from "./pages/CodeyWorld";

// Páginas menos usadas pela criança carregam sob demanda: o pacote inicial fica
// bem menor e o mapa/lições abrem mais rápido. (Admin traz gráficos pesados.)
const CharacterCreator = lazy(() => import("./pages/CharacterCreator"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const Friends = lazy(() => import("./pages/Friends"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageFallback = () => <div className="min-h-screen bg-background" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CompanionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <GlobalThemeToggle />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/hub" element={<WorldHub />} />
                  <Route path="/character" element={<CharacterCreator />} />
                  <Route path="/world/:islandId" element={<CodeyWorld />} />
                  <Route path="/world/:islandId/lesson/:lessonId" element={<CodeyWorld />} />
                  <Route path="/perfil" element={<Profile />} />
                  <Route path="/amigos" element={<Friends />} />
                  <Route path="/ranking" element={<Leaderboard />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CompanionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
