import { supabaseAdmin } from "../supabase";
import { mapNotification } from "../utils/mappers";

export const notificationsStorage = {
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
  }
};
