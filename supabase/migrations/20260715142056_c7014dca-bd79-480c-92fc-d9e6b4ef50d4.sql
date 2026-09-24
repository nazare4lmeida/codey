
-- ============================================================
-- FASE 2: Progresso persistente + comunidade + badges
-- ============================================================

-- 1) HISTÓRICO DE TENTATIVAS (nunca sobrescreve)
CREATE TABLE public.lesson_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  island_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  hearts_left INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lesson_attempts_user ON public.lesson_attempts(user_id, created_at DESC);
CREATE INDEX idx_lesson_attempts_lesson ON public.lesson_attempts(user_id, island_id, lesson_id);

GRANT SELECT, INSERT, DELETE ON public.lesson_attempts TO authenticated;
GRANT ALL ON public.lesson_attempts TO service_role;
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attempts_select_own" ON public.lesson_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON public.lesson_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_delete_own" ON public.lesson_attempts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 2) CATÁLOGO DE BADGES + CONCESSÕES
CREATE TABLE public.badges (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_public_read" ON public.badges FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.badges (code, name, description, icon) VALUES
  ('first_lesson', 'Primeiros Passos', 'Concluiu a primeira lição', 'sparkles'),
  ('perfect_lesson', 'Perfeição', 'Terminou uma lição sem errar', 'star'),
  ('island_complete', 'Ilha Dominada', 'Concluiu todas as lições de uma ilha', 'map'),
  ('streak_3', 'Ritmo!', '3 dias seguidos praticando', 'flame'),
  ('streak_7', 'Semana Guerreira', '7 dias seguidos praticando', 'flame'),
  ('points_100', 'Centurião', 'Acumulou 100 pontos', 'trophy'),
  ('points_500', 'Meio Milhar', 'Acumulou 500 pontos', 'trophy'),
  ('friend_added', 'Amizade Codey', 'Adicionou o primeiro amigo', 'users')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_code)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_any_authed" ON public.user_badges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_badges_insert_own" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- 3) AMIZADES
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_involved" ON public.friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_insert_own" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update_addressee" ON public.friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "friendships_delete_involved" ON public.friendships
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TRIGGER trg_friendships_updated
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4) MENSAGENS DE ENCORAJAMENTO
CREATE TABLE public.encouragements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 240),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_user_id <> to_user_id)
);
CREATE INDEX idx_encouragements_to ON public.encouragements(to_user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.encouragements TO authenticated;
GRANT ALL ON public.encouragements TO service_role;
ALTER TABLE public.encouragements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "encouragements_select_involved" ON public.encouragements
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "encouragements_insert_own" ON public.encouragements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "encouragements_update_receiver" ON public.encouragements
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id);


-- 5) PROFILES: permitir busca pública de display_name (para amigos/ranking)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT TO authenticated USING (true);


-- 6) FUNÇÕES DE AGREGAÇÃO
-- Pontos totais do usuário (soma do melhor score por lição)
CREATE OR REPLACE FUNCTION public.user_total_points(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(SUM(best_score), 0)::INTEGER FROM (
    SELECT MAX(score) AS best_score
    FROM public.lesson_attempts
    WHERE user_id = _user_id
    GROUP BY island_id, lesson_id
  ) t;
$$;

-- Streak de dias seguidos
CREATE OR REPLACE FUNCTION public.user_streak_days(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  streak INT := 0;
  d DATE := (now() AT TIME ZONE 'UTC')::DATE;
  has_row BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.lesson_attempts
      WHERE user_id = _user_id
        AND (created_at AT TIME ZONE 'UTC')::DATE = d
    ) INTO has_row;
    IF NOT has_row THEN
      -- Se hoje sem atividade, tenta ontem antes de sair
      IF streak = 0 AND d = (now() AT TIME ZONE 'UTC')::DATE THEN
        d := d - 1;
        CONTINUE;
      END IF;
      EXIT;
    END IF;
    streak := streak + 1;
    d := d - 1;
  END LOOP;
  RETURN streak;
END;
$$;

-- Pontos da semana atual (segunda a domingo, UTC)
CREATE OR REPLACE FUNCTION public.user_weekly_points(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(SUM(score), 0)::INTEGER
  FROM public.lesson_attempts
  WHERE user_id = _user_id
    AND created_at >= date_trunc('week', now());
$$;

-- Leaderboard semanal
CREATE OR REPLACE FUNCTION public.weekly_leaderboard(_limit INTEGER DEFAULT 20)
RETURNS TABLE(user_id UUID, display_name TEXT, weekly_points INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    la.user_id,
    COALESCE(p.display_name, 'Programador') AS display_name,
    SUM(la.score)::INTEGER AS weekly_points
  FROM public.lesson_attempts la
  LEFT JOIN public.profiles p ON p.user_id = la.user_id
  WHERE la.created_at >= date_trunc('week', now())
  GROUP BY la.user_id, p.display_name
  ORDER BY weekly_points DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.user_total_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_streak_days(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_weekly_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_leaderboard(INTEGER) TO authenticated;
