import { supabaseAdmin } from "../supabase";
import { mapSubmission } from "../utils/mappers";

export const submissionsStorage = {
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
  }
};
