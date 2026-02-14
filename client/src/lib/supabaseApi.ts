import { supabase } from "@/lib/supabase";

// USERS (leaderboard)
export async function listLeaderboardUsers(limit = 100) {
  const { data, error } = await supabase
    .from("leaderboard_users") // your view
    .select("id, first_name, last_name, profile_image_url, level, points")
    .order("points", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// MISSIONS
export async function listMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMission(id: number) {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// REWARDS
export async function listRewards() {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
