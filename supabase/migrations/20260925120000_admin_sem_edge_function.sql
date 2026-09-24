-- =============================================================================
-- Painel admin SEM Edge Function
-- Substitui a função "admin-users" por funções SQL chamadas direto pelo painel.
-- Rode UMA vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
--
-- Segurança: toda função começa conferindo se QUEM CHAMA é admin (has_role).
-- Sem isso, nada acontece. Só usuários logados podem chamar; visitantes, não.
-- =============================================================================

-- Confere se quem chamou é admin; se não for, interrompe tudo.
CREATE OR REPLACE FUNCTION public._require_admin()
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores.' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Lista os usuários (e-mail, datas e nome de exibição).
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, display_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
  PERFORM public._require_admin();
  RETURN QUERY
    SELECT u.id,
           u.email::text,
           u.created_at,
           u.last_sign_in_at,
           COALESCE(NULLIF(p.display_name, ''), u.raw_user_meta_data->>'display_name', '')::text
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

-- Muda nome de exibição, e-mail e/ou senha (o que vier vazio fica como está).
CREATE OR REPLACE FUNCTION public.admin_update_user(
  _user_id uuid,
  _display_name text DEFAULT NULL,
  _email text DEFAULT NULL,
  _password text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  _new_email text := lower(trim(COALESCE(_email, '')));
BEGIN
  PERFORM public._require_admin();

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  IF _display_name IS NOT NULL THEN
    UPDATE auth.users
       SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('display_name', _display_name),
           updated_at = now()
     WHERE id = _user_id;
    UPDATE public.profiles SET display_name = _display_name WHERE user_id = _user_id;
  END IF;

  IF _new_email <> '' THEN
    IF _new_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
      RAISE EXCEPTION 'Esse e-mail não parece válido.';
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = _new_email AND id <> _user_id) THEN
      RAISE EXCEPTION 'Esse e-mail já está em uso por outra conta.';
    END IF;
    UPDATE auth.users
       SET email = _new_email, email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
     WHERE id = _user_id;
    -- o login por e-mail também guarda o endereço aqui
    UPDATE auth.identities
       SET identity_data = COALESCE(identity_data, '{}'::jsonb) || jsonb_build_object('email', _new_email),
           updated_at = now()
     WHERE user_id = _user_id AND provider = 'email';
  END IF;

  IF COALESCE(_password, '') <> '' THEN
    IF length(_password) < 6 THEN
      RAISE EXCEPTION 'A senha precisa ter pelo menos 6 caracteres.';
    END IF;
    -- mesmo formato de senha (bcrypt) que o login do Supabase usa
    UPDATE auth.users
       SET encrypted_password = extensions.crypt(_password, extensions.gen_salt('bf')), updated_at = now()
     WHERE id = _user_id;
  END IF;
END;
$$;

-- Apaga uma conta (e, em cascata, perfil, companheiro, progresso etc.).
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  PERFORM public._require_admin();
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode apagar a sua própria conta pelo painel.';
  END IF;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Dá ou tira um papel (ex.: admin).
CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _role public.app_role, _enabled boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- evita que você fique trancada fora do painel sem querer
    IF _user_id = auth.uid() AND _role = 'admin' THEN
      RAISE EXCEPTION 'Você não pode tirar o seu próprio acesso de admin.';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
END;
$$;

-- Só usuários logados podem chamar (e cada função ainda confere se é admin).
REVOKE ALL ON FUNCTION public._require_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_user(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_role(uuid, public.app_role, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._require_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, public.app_role, boolean) TO authenticated;
