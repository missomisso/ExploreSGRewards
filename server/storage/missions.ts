import { supabaseAdmin } from "../supabase";
import { mapMission, mapUserMission } from "../utils/mappers";

export const missionsStorage = {
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
  }
};
