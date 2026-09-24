import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface UserStats {
  totalPoints: number;
  streak: number;
  weekly: number;
  level: number;
}

export const levelFromPoints = (points: number) => Math.max(1, Math.floor(points / 100) + 1);

export const useStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({ totalPoints: 0, streak: 0, weekly: 0, level: 1 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [t, s, w] = await Promise.all([
      supabase.rpc("user_total_points", { _user_id: user.id }),
      supabase.rpc("user_streak_days", { _user_id: user.id }),
      supabase.rpc("user_weekly_points", { _user_id: user.id }),
    ]);
    const totalPoints = (t.data as number) || 0;
    setStats({
      totalPoints,
      streak: (s.data as number) || 0,
      weekly: (w.data as number) || 0,
      level: levelFromPoints(totalPoints),
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
};
