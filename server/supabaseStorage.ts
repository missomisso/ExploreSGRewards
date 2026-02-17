import { supabaseAdmin } from "./supabase";

function mapUser(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    profileImageUrl: row.profile_image_url,
    role: row.role,
    businessName: row.business_name,
    businessDescription: row.business_description,
    level: row.level,
    points: row.points,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMission(row: any) {
  if (!row) return undefined;
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

function mapUserMission(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    missionId: row.mission_id,
    status: row.status,
    completedTasks: row.completed_tasks ?? [],
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function mapSubmission(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    missionId: row.mission_id,
    taskId: row.task_id,
    type: row.type,
    proofUrl: row.proof_url,
    answer: row.answer,
    status: row.status,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

function mapReward(row: any) {
  if (!row) return undefined;
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

function mapUserReward(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    rewardId: row.reward_id,
    code: row.code,
    used: row.used,
    claimedAt: row.claimed_at,
    expiresAt: row.expires_at,
  };
}

function mapNotification(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    relatedId: row.related_id,
    createdAt: row.created_at,
  };
}

export const sbStorage = {
  // ===== USERS =====
  async getUser(id: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return undefined;
    return mapUser(data);
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error || !data) return undefined;
    return mapUser(data);
  },

  async createUser(user: any) {
    const row: any = {
      id: user.id,
      email: user.email,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      profile_image_url: user.profileImageUrl ?? null,
      role: user.role ?? "tourist",
      business_name: user.businessName ?? null,
      business_description: user.businessDescription ?? null,
      level: user.level ?? 1,
      points: user.points ?? 0,
    };
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async updateUser(id: string, updates: any) {
    const row: any = {};
    if (updates.email !== undefined) row.email = updates.email;
    if (updates.firstName !== undefined) row.first_name = updates.firstName;
    if (updates.lastName !== undefined) row.last_name = updates.lastName;
    if (updates.profileImageUrl !== undefined) row.profile_image_url = updates.profileImageUrl;
    if (updates.role !== undefined) row.role = updates.role;
    if (updates.businessName !== undefined) row.business_name = updates.businessName;
    if (updates.businessDescription !== undefined) row.business_description = updates.businessDescription;
    if (updates.level !== undefined) row.level = updates.level;
    if (updates.points !== undefined) row.points = updates.points;
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) return undefined;
    return mapUser(data);
  },

  async updateUserPoints(id: string, points: number) {
    await supabaseAdmin
      .from("users")
      .update({ points, updated_at: new Date().toISOString() })
      .eq("id", id);
  },

  // ===== MISSIONS =====
  async getMissions(activeOnly: boolean = true) {
    let query = supabaseAdmin.from("missions").select("*").order("created_at", { ascending: false });
    if (activeOnly) {
      query = query.eq("status", "active");
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapMission);
  },

  async getMission(id: number) {
    const { data, error } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return undefined;
    return mapMission(data);
  },

  async createMission(mission: any) {
    const row: any = {
      business_id: mission.businessId ?? null,
      title: mission.title,
      description: mission.description,
      location: mission.location ?? null,
      total_points: mission.totalPoints,
      category: mission.category ?? null,
      image_url: mission.imageUrl ?? null,
      status: mission.status ?? "active",
      start_date: mission.startDate ?? null,
      end_date: mission.endDate ?? null,
      tasks: mission.tasks,
    };
    const { data, error } = await supabaseAdmin
      .from("missions")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapMission(data);
  },

  async updateMission(id: number, updates: any) {
    const row: any = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.location !== undefined) row.location = updates.location;
    if (updates.totalPoints !== undefined) row.total_points = updates.totalPoints;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.startDate !== undefined) row.start_date = updates.startDate;
    if (updates.endDate !== undefined) row.end_date = updates.endDate;
    if (updates.tasks !== undefined) row.tasks = updates.tasks;

    const { data, error } = await supabaseAdmin
      .from("missions")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) return undefined;
    return mapMission(data);
  },

  async deleteMission(id: number) {
    await supabaseAdmin.from("submissions").delete().eq("mission_id", id);
    await supabaseAdmin.from("user_missions").delete().eq("mission_id", id);
    await supabaseAdmin.from("missions").delete().eq("id", id);
  },

  // ===== USER MISSIONS =====
  async getUserMission(userId: string, missionId: number) {
    const { data, error } = await supabaseAdmin
      .from("user_missions")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .maybeSingle();
    if (error || !data) return undefined;
    return mapUserMission(data);
  },

  async createUserMission(um: any) {
    const row: any = {
      user_id: um.userId,
      mission_id: um.missionId,
      status: um.status ?? "in_progress",
      completed_tasks: um.completedTasks ?? [],
    };
    const { data, error } = await supabaseAdmin
      .from("user_missions")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapUserMission(data);
  },

  async updateUserMission(id: number, updates: any) {
    const row: any = {};
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.completedTasks !== undefined) row.completed_tasks = updates.completedTasks;
    if (updates.completedAt !== undefined) row.completed_at = updates.completedAt instanceof Date ? updates.completedAt.toISOString() : updates.completedAt;

    const { data, error } = await supabaseAdmin
      .from("user_missions")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) return undefined;
    return mapUserMission(data);
  },

  async getUserMissions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("user_missions")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map(mapUserMission);
  },

  // ===== SUBMISSIONS =====
  async createSubmission(sub: any) {
    const row: any = {
      user_id: sub.userId,
      mission_id: sub.missionId,
      task_id: sub.taskId,
      type: sub.type,
      proof_url: sub.proofUrl ?? null,
      answer: sub.answer ?? null,
      status: sub.status ?? "pending",
      review_note: sub.reviewNote ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapSubmission(data);
  },

  async getSubmissions(missionId?: number, status?: string) {
    let query = supabaseAdmin.from("submissions").select("*").order("submitted_at", { ascending: false });
    if (missionId) query = query.eq("mission_id", missionId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapSubmission);
  },

  async updateSubmission(id: number, updates: any) {
    const row: any = {};
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.reviewNote !== undefined) row.review_note = updates.reviewNote;
    if (updates.reviewedAt !== undefined) row.reviewed_at = updates.reviewedAt instanceof Date ? updates.reviewedAt.toISOString() : updates.reviewedAt;
    if (updates.proofUrl !== undefined) row.proof_url = updates.proofUrl;

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) return undefined;
    return mapSubmission(data);
  },

  async getUserSubmissions(userId: string, missionId: number) {
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapSubmission);
  },

  // ===== REWARDS =====
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

  // ===== USER REWARDS =====
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

  // ===== NOTIFICATIONS =====
  async getNotifications(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapNotification);
  },

  async createNotification(notif: any) {
    const row: any = {
      user_id: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.read ?? false,
      related_id: notif.relatedId ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapNotification(data);
  },

  async markNotificationRead(id: number) {
    await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  },

  async markAllNotificationsRead(userId: string) {
    await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId);
  },

  async getUnreadNotificationCount(userId: string) {
    const { count, error } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) return 0;
    return count ?? 0;
  },

  // ===== ADMIN QUERIES =====
  async getLeaderboard(limit = 50) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, profile_image_url, points, level, role")
      .eq("role", "tourist")
      .order("points", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async getAllUsers(limit = 100) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, profile_image_url, points, level, role, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async getRewardsWithCounts() {
    const { data: allRewards, error } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const results = [];
    for (const r of (allRewards ?? [])) {
      const claimedCount = await sbStorage.getClaimedCount(r.id);
      const mapped = mapReward(r);
      results.push({
        ...mapped,
        claimedCount,
        remainingQuantity: r.quantity_limit ? Math.max(0, r.quantity_limit - claimedCount) : null,
        isSoldOut: r.quantity_limit ? claimedCount >= r.quantity_limit : false,
      });
    }
    return results;
  },
};
