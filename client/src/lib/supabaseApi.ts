import { supabase } from "@/lib/supabase";

function mapMission(row: any) {
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    description: row.description,
    location: row.location,
    totalPoints: row.total_points,
    category: row.category,
    imageUrl: row.image_url,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    tasks: row.tasks ?? [],
    createdAt: row.created_at,
  };
}

function mapReward(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    cost: row.cost,
    merchant: row.merchant,
    icon: row.icon,
    category: row.category,
    expiryDays: row.expiry_days,
    quantityLimit: row.quantity_limit,
    businessId: row.business_id,
    createdAt: row.created_at,
  };
}

// USERS (leaderboard)
export async function listLeaderboardUsers(limit = 100) {
  const { data, error } = await supabase
    .from("leaderboard_users")
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
  return (data ?? []).map(mapMission);
}

export async function getMission(id: number) {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data ? mapMission(data) : null;
}

// REWARDS
export async function listRewards() {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapReward);
}
