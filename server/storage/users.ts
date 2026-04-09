import { supabaseAdmin } from "../supabase";
import { mapUser } from "../utils/mappers";

export const usersStorage = {
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
};
