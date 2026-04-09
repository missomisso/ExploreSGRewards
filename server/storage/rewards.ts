import { supabaseAdmin } from "../supabase";
import { mapReward, mapUserReward } from "../utils/mappers";

export const rewardsStorage = {
  async getRewards() {
    const { data, error } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReward);
  },

  async getReward(id: number) {
    const { data, error } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return undefined;
    return mapReward(data);
  },

  async createReward(reward: any) {
    const row: any = {
      title: reward.title,
      description: reward.description ?? null,
      cost: reward.cost,
      merchant: reward.merchant ?? null,
      icon: reward.icon ?? null,
      category: reward.category ?? null,
      expiry_days: reward.expiryDays ?? 30,
      quantity_limit: reward.quantityLimit ?? null,
      business_id: reward.businessId ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from("rewards")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapReward(data);
  },

  async deleteReward(id: number) {
    await supabaseAdmin.from("user_rewards").delete().eq("reward_id", id);
    await supabaseAdmin.from("rewards").delete().eq("id", id);
  },

  async createUserReward(ur: any) {
    const row: any = {
      user_id: ur.userId,
      reward_id: ur.rewardId,
      code: ur.code,
      used: ur.used ?? false,
      expires_at: ur.expiresAt instanceof Date ? ur.expiresAt.toISOString() : ur.expiresAt,
    };
    const { data, error } = await supabaseAdmin
      .from("user_rewards")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapUserReward(data);
  },

  async getUserRewards(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("user_rewards")
      .select("*")
      .eq("user_id", userId)
      .order("claimed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapUserReward);
  },

  async getClaimedCount(rewardId: number) {
    const { count, error } = await supabaseAdmin
      .from("user_rewards")
      .select("*", { count: "exact", head: true })
      .eq("reward_id", rewardId);
    if (error) return 0;
    return count ?? 0;
  },

  async getRewardsWithCounts() {
    const { data: allRewards, error } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const results = [];
    for (const r of (allRewards ?? [])) {
      const claimedCount = await this.getClaimedCount(r.id);
      const mapped = mapReward(r);
      results.push({
        ...mapped,
        claimedCount,
        remainingQuantity: r.quantity_limit ? Math.max(0, r.quantity_limit - claimedCount) : null,
        isSoldOut: r.quantity_limit ? claimedCount >= r.quantity_limit : false,
      });
    }
    return results;
  }
};
