-- =============================================================================
-- Nomes no painel e no ranking
-- Problema: contas com o nome da conta (profiles.display_name) vazio apareciam como
-- "600f14" no painel e "Programador" no ranking, mesmo com a criança tendo escolhido
-- um nome de programador (characters.name) no criador de companheiro.
-- Rode UMA vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- =============================================================================

-- 1) Toda conta passa a ter uma linha de perfil (algumas contas antigas não tinham).
INSERT INTO public.profiles (user_id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- 2) Nome da conta vazio → usa o nome de programador escolhido no criador.
UPDATE public.profiles p
   SET display_name = trim(c.name)
  FROM public.characters c
 WHERE c.user_id = p.user_id
   AND trim(COALESCE(p.display_name, '')) = ''
   AND trim(COALESCE(c.name, '')) <> '';

-- 3) Daqui para frente: ao salvar o companheiro, se o nome da conta estiver vazio, preenche.
CREATE OR REPLACE FUNCTION public.fill_empty_display_name()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF trim(COALESCE(NEW.name, '')) <> '' THEN
    UPDATE public.profiles
       SET display_name = trim(NEW.name)
     WHERE user_id = NEW.user_id AND trim(COALESCE(display_name, '')) = '';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fill_empty_display_name() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS characters_fill_display_name ON public.characters;
CREATE TRIGGER characters_fill_display_name
  AFTER INSERT OR UPDATE OF name ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.fill_empty_display_name();

-- 4) Ranking: usa o nome da conta; se vazio, o nome de programador; só então "Programador".
CREATE OR REPLACE FUNCTION public.weekly_leaderboard(_limit INTEGER DEFAULT 20)
RETURNS TABLE(user_id UUID, display_name TEXT, weekly_points INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    w.user_id,
    COALESCE(NULLIF(trim(p.display_name), ''), NULLIF(trim(c.name), ''), 'Programador') AS display_name,
    w.weekly_points
  FROM (
    SELECT la.user_id, SUM(la.score)::INTEGER AS weekly_points
    FROM public.lesson_attempts la
    WHERE la.created_at >= date_trunc('week', now())
    GROUP BY la.user_id
  ) w
  LEFT JOIN public.profiles p ON p.user_id = w.user_id
  LEFT JOIN public.characters c ON c.user_id = w.user_id
  ORDER BY w.weekly_points DESC
  LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.weekly_leaderboard(INTEGER) TO authenticated;
