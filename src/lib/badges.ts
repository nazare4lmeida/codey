import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAMES: Record<string, string> = {
  first_lesson: "Primeiros Passos",
  perfect_lesson: "Perfeição",
  island_complete: "Ilha Dominada",
  streak_3: "Ritmo!",
  streak_7: "Semana Guerreira",
  points_100: "Centurião",
  points_500: "Meio Milhar",
  friend_added: "Amizade Codey",
};

export async function grantBadge(userId: string, code: keyof typeof NAMES) {
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_code", code)
    .maybeSingle();
  if (existing) return false;
  const { error } = await supabase.from("user_badges").insert({ user_id: userId, badge_code: code });
  if (!error) {
    toast.success(`🏅 Conquista desbloqueada: ${NAMES[code]}!`);
    return true;
  }
  return false;
}

export async function checkPointBadges(userId: string, totalPoints: number) {
  if (totalPoints >= 500) await grantBadge(userId, "points_500");
  if (totalPoints >= 100) await grantBadge(userId, "points_100");
}

export async function checkStreakBadges(userId: string, streak: number) {
  if (streak >= 7) await grantBadge(userId, "streak_7");
  if (streak >= 3) await grantBadge(userId, "streak_3");
}
