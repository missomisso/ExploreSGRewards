import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ===== MAPPING HELPERS =====
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

// ===== AUTH HELPERS =====
async function verifySupabaseToken(token: string) {
  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

const app = express();
app.use(express.json());

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authorization token provided" });
  }
  const token = authHeader.substring(7);
  const user = await verifySupabaseToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.userId = user.id;
  req.userEmail = user.email;
  next();
}

// ===== SUPABASE CONFIG =====
app.get("/api/config/supabase", (_req, res) => {
  res.json({
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

// ===== AUTH SYNC =====
app.post("/api/auth/sync", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token provided" });
    }
    const token = authHeader.substring(7);
    const supabaseUser = await verifySupabaseToken(token);
    if (!supabaseUser) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { firstName, lastName, profileImageUrl } = req.body;
    const id = supabaseUser.id;
    const email = supabaseUser.email;

    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    let user;
    if (existing) {
      const { data: updated, error } = await supabaseAdmin
        .from("users")
        .update({
          email,
          first_name:
            firstName ||
            supabaseUser.user_metadata?.first_name ||
            existing.first_name,
          last_name:
            lastName ||
            supabaseUser.user_metadata?.last_name ||
            existing.last_name,
          profile_image_url:
            profileImageUrl ||
            supabaseUser.user_metadata?.avatar_url ||
            existing.profile_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      user = mapUser(updated);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("users")
        .insert({
          id,
          email,
          first_name:
            firstName ||
            supabaseUser.user_metadata?.first_name ||
            supabaseUser.user_metadata?.full_name?.split(" ")[0] ||
            null,
          last_name:
            lastName ||
            supabaseUser.user_metadata?.last_name ||
            supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
            null,
          profile_image_url:
            profileImageUrl ||
            supabaseUser.user_metadata?.avatar_url ||
            null,
          role: "tourist",
          level: 1,
          points: 0,
        })
        .select()
        .single();
      if (error) throw error;
      user = mapUser(created);
    }
    res.json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

// GET auth user by ID
app.get("/api/auth/user/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const requestedId = req.params.id;
    if (authUser.id !== requestedId) {
      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { data: userData, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", requestedId)
      .single();
    if (error || !userData) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(mapUser(userData));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ===== DB CHECK =====
app.get("/api/db-check", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
    if (error) throw error;
    res.json({ ok: true, connected: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
});

app.get("/api/db-tables", async (_req, res) => {
  try {
    const tables = ["users", "missions", "user_missions", "submissions", "rewards", "user_rewards", "notifications"];
    res.json(tables.map(t => ({ tablename: t })));
  } catch (error) {
    res.status(500).json({ error: "Failed to list tables" });
  }
});

// ===== MISSIONS =====
app.get("/api/missions", async (req, res) => {
  try {
    const all = req.query.all === "true";
    let query = supabaseAdmin.from("missions").select("*").order("created_at", { ascending: false });
    if (!all) {
      query = query.eq("status", "active");
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json((data ?? []).map(mapMission));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch missions" });
  }
});

app.get("/api/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data, error } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: "Mission not found" });
    }
    res.json(mapMission(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mission" });
  }
});

app.post("/api/missions", async (req, res) => {
  try {
    const body = { ...req.body };
    const row: any = {
      business_id: body.businessId ?? null,
      title: body.title,
      description: body.description,
      location: body.location ?? null,
      total_points: body.totalPoints,
      category: body.category ?? null,
      image_url: body.imageUrl ?? null,
      status: body.status ?? "active",
      start_date: body.startDate ?? null,
      end_date: body.endDate ?? null,
      tasks: body.tasks,
    };
    const { data, error } = await supabaseAdmin
      .from("missions")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(mapMission(data));
  } catch (error: any) {
    console.error("Mission creation error:", error?.message || error);
    res.status(400).json({
      error: "Invalid mission data",
      details: error?.message,
    });
  }
});

app.patch("/api/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const row: any = {};
    if (req.body.title !== undefined) row.title = req.body.title;
    if (req.body.description !== undefined) row.description = req.body.description;
    if (req.body.location !== undefined) row.location = req.body.location;
    if (req.body.status !== undefined) row.status = req.body.status;
    if (req.body.tasks !== undefined) row.tasks = req.body.tasks;
    if (req.body.totalPoints !== undefined) row.total_points = req.body.totalPoints;
    if (req.body.category !== undefined) row.category = req.body.category;
    if (req.body.startDate !== undefined) row.start_date = req.body.startDate;
    if (req.body.endDate !== undefined) row.end_date = req.body.endDate;

    const { data, error } = await supabaseAdmin
      .from("missions")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      return res.status(404).json({ error: "Mission not found" });
    }
    res.json(mapMission(data));
  } catch (error) {
    res.status(400).json({ error: "Failed to update mission" });
  }
});

app.delete("/api/missions/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data: mission } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", id)
      .single();
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.userId!)
      .single();
    if (user?.role !== "admin" && mission.business_id !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this mission" });
    }
    await supabaseAdmin.from("submissions").delete().eq("mission_id", id);
    await supabaseAdmin.from("user_missions").delete().eq("mission_id", id);
    await supabaseAdmin.from("missions").delete().eq("id", id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete mission" });
  }
});

// ===== USER MISSIONS =====
app.post("/api/user-missions", async (req, res) => {
  try {
    const { userId, missionId } = req.body;
    const { data: existing } = await supabaseAdmin
      .from("user_missions")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .single();
    if (existing) {
      return res.json(mapUserMission(existing));
    }
    const { data, error } = await supabaseAdmin
      .from("user_missions")
      .insert({
        user_id: userId,
        mission_id: missionId,
        status: "in_progress",
        completed_tasks: [],
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(mapUserMission(data));
  } catch (error) {
    res.status(400).json({ error: "Failed to start mission" });
  }
});

app.get("/api/user-missions/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { data, error } = await supabaseAdmin
      .from("user_missions")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    res.json((data ?? []).map(mapUserMission));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user missions" });
  }
});

app.patch("/api/user-missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const row: any = {};
    if (req.body.status !== undefined) row.status = req.body.status;
    if (req.body.completedTasks !== undefined) row.completed_tasks = req.body.completedTasks;
    if (req.body.completedAt !== undefined) row.completed_at = req.body.completedAt instanceof Date ? req.body.completedAt.toISOString() : req.body.completedAt;

    const { data, error } = await supabaseAdmin
      .from("user_missions")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      return res.status(404).json({ error: "User mission not found" });
    }
    res.json(mapUserMission(data));
  } catch (error) {
    res.status(400).json({ error: "Failed to update user mission" });
  }
});

// ===== TASK COMPLETION =====
app.post("/api/tasks/complete", async (req, res) => {
  try {
    const { userId, missionId, taskId, taskType, answer, proofUrl } = req.body;

    if (!userId || !missionId || !taskId || !taskType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: mission } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    const task = (mission.tasks ?? []).find((t: any) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    let { data: userMissionRow } = await supabaseAdmin
      .from("user_missions")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .single();

    if (!userMissionRow) {
      const { data: created, error } = await supabaseAdmin
        .from("user_missions")
        .insert({
          user_id: userId,
          mission_id: missionId,
          status: "in_progress",
          completed_tasks: [],
        })
        .select()
        .single();
      if (error) throw error;
      userMissionRow = created;
    }

    const completedTasksList: string[] = userMissionRow.completed_tasks ?? [];
    if (completedTasksList.includes(taskId)) {
      return res.status(400).json({ error: "Task already completed" });
    }

    const autoValidatedTypes = ["gps", "quiz", "qrcode"];
    const manualReviewTypes = ["photo", "receipt"];

    if (autoValidatedTypes.includes(taskType)) {
      if (taskType === "quiz") {
        const correctAnswer = (task as any).correctAnswer;
        const userAnswer = parseInt(answer);
        if (correctAnswer !== userAnswer) {
          return res
            .status(400)
            .json({ error: "Incorrect answer", valid: false });
        }
      }

      const completedTasks = [...completedTasksList, taskId];
      await supabaseAdmin
        .from("user_missions")
        .update({ completed_tasks: completedTasks })
        .eq("id", userMissionRow.id);

      const { data: user } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (user) {
        await supabaseAdmin
          .from("users")
          .update({ points: user.points + task.points, updated_at: new Date().toISOString() })
          .eq("id", userId);
      }

      if (completedTasks.length === mission.tasks.length) {
        await supabaseAdmin
          .from("user_missions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", userMissionRow.id);
      }

      return res.json({
        success: true,
        pointsAwarded: task.points,
        autoValidated: true,
        completedTasks,
      });
    } else if (manualReviewTypes.includes(taskType)) {
      const { data: submission, error } = await supabaseAdmin
        .from("submissions")
        .insert({
          user_id: userId,
          mission_id: missionId,
          task_id: taskId,
          type: taskType,
          proof_url: proofUrl || null,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      return res.json({
        success: true,
        pendingReview: true,
        submissionId: submission.id,
        message: "Your submission is pending review",
      });
    }

    return res.status(400).json({ error: "Unknown task type" });
  } catch (error) {
    console.error("Task completion error:", error);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// ===== SUBMISSIONS =====
app.post("/api/submissions", async (req, res) => {
  try {
    const b = req.body;
    const row: any = {
      user_id: b.userId,
      mission_id: b.missionId,
      task_id: b.taskId,
      type: b.type,
      proof_url: b.proofUrl ?? null,
      answer: b.answer ?? null,
      status: b.status ?? "pending",
      review_note: b.reviewNote ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(mapSubmission(data));
  } catch (error) {
    res.status(400).json({ error: "Invalid submission data" });
  }
});

app.get("/api/submissions", async (req, res) => {
  try {
    const missionId = req.query.missionId
      ? parseInt(req.query.missionId as string)
      : undefined;
    const status = req.query.status as string | undefined;

    let query = supabaseAdmin.from("submissions").select("*").order("submitted_at", { ascending: false });
    if (missionId) query = query.eq("mission_id", missionId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    res.json((data ?? []).map(mapSubmission));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

app.patch("/api/submissions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const row: any = {};
    if (req.body.status !== undefined) row.status = req.body.status;
    if (req.body.reviewNote !== undefined) row.review_note = req.body.reviewNote;
    if (req.body.reviewedAt !== undefined) row.reviewed_at = req.body.reviewedAt instanceof Date ? req.body.reviewedAt.toISOString() : req.body.reviewedAt;
    if (req.body.proofUrl !== undefined) row.proof_url = req.body.proofUrl;

    const { data: updatedRow, error } = await supabaseAdmin
      .from("submissions")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error || !updatedRow) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const updated = mapSubmission(updatedRow)!;
    const { userId, missionId, taskId } = updated;

    const { data: missionRow } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();
    const mission = missionRow ? mapMission(missionRow) : undefined;
    const task = mission?.tasks.find((t: any) => t.id === taskId);

    if (req.body.status === "approved") {
      if (mission && task) {
        const { data: userRow } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
        if (userRow) {
          await supabaseAdmin
            .from("users")
            .update({ points: userRow.points + task.points, updated_at: new Date().toISOString() })
            .eq("id", userId);
        }

        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          type: "submission_approved",
          title: "Task Approved!",
          message: `Your submission for ${task.title} has been approved. You earned ${task.points} points!`,
          read: false,
          related_id: missionId,
        });

        let { data: umRow } = await supabaseAdmin
          .from("user_missions")
          .select("*")
          .eq("user_id", userId)
          .eq("mission_id", missionId)
          .single();

        if (!umRow) {
          const { data: created } = await supabaseAdmin
            .from("user_missions")
            .insert({
              user_id: userId,
              mission_id: missionId,
              status: "in_progress",
              completed_tasks: [],
            })
            .select()
            .single();
          umRow = created;
        }

        const completedTasks = [...(umRow.completed_tasks ?? []), taskId];
        await supabaseAdmin
          .from("user_missions")
          .update({ completed_tasks: completedTasks })
          .eq("id", umRow.id);

        if (completedTasks.length === mission.tasks.length) {
          await supabaseAdmin
            .from("user_missions")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("id", umRow.id);

          await supabaseAdmin.from("notifications").insert({
            user_id: userId,
            type: "mission_completed",
            title: "Mission Complete!",
            message: `Congratulations! You completed ${mission.title} and earned ${mission.totalPoints} points!`,
            read: false,
            related_id: missionId,
          });
        }
      }
    } else if (req.body.status === "rejected") {
      if (task) {
        const reviewNote = req.body.reviewNote || updated.reviewNote;
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          type: "submission_rejected",
          title: "Submission Rejected",
          message: `Your submission for ${task.title} was not approved.${reviewNote ? ` ${reviewNote}` : ""}`,
          read: false,
          related_id: missionId,
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Failed to update submission" });
  }
});

// ===== REWARDS =====
app.get("/api/rewards", async (_req, res) => {
  try {
    const { data: allRewards, error } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const results = [];
    for (const r of allRewards ?? []) {
      const { count: claimedCount } = await supabaseAdmin
        .from("user_rewards")
        .select("*", { count: "exact", head: true })
        .eq("reward_id", r.id);
      const claimed = claimedCount ?? 0;
      const mapped = mapReward(r);
      results.push({
        ...mapped,
        claimedCount: claimed,
        remainingQuantity: r.quantity_limit
          ? Math.max(0, r.quantity_limit - claimed)
          : null,
        isSoldOut: r.quantity_limit ? claimed >= r.quantity_limit : false,
      });
    }
    res.json(results);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

app.post("/api/rewards", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "business")
    ) {
      return res
        .status(403)
        .json({ error: "Admin or business access required" });
    }

    const b = req.body;
    const row: any = {
      title: b.title,
      description: b.description ?? null,
      cost: b.cost,
      merchant:
        currentUser.role === "business"
          ? currentUser.business_name || b.merchant
          : b.merchant,
      icon: b.icon ?? null,
      category: b.category ?? null,
      expiry_days: b.expiryDays ?? 30,
      quantity_limit: b.quantityLimit ?? null,
      business_id:
        currentUser.role === "business" ? authUser.id : b.businessId ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from("rewards")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(mapReward(data));
  } catch (error) {
    res.status(400).json({ error: "Invalid reward data" });
  }
});

app.delete("/api/rewards/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "business")
    ) {
      return res
        .status(403)
        .json({ error: "Admin or business access required" });
    }

    const id = parseInt(req.params.id);
    const { data: reward } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .eq("id", id)
      .single();
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }
    if (currentUser.role === "business" && reward.business_id !== authUser.id) {
      return res
        .status(403)
        .json({ error: "Cannot delete other businesses' rewards" });
    }

    await supabaseAdmin.from("user_rewards").delete().eq("reward_id", id);
    await supabaseAdmin.from("rewards").delete().eq("id", id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete reward" });
  }
});

app.post("/api/rewards/claim", async (req, res) => {
  try {
    const { userId, rewardId } = req.body;

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    const { data: rewardRow } = await supabaseAdmin
      .from("rewards")
      .select("*")
      .eq("id", rewardId)
      .single();

    if (!userRow || !rewardRow) {
      return res.status(404).json({ error: "User or reward not found" });
    }

    if (userRow.points < rewardRow.cost) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    if (rewardRow.quantity_limit) {
      const { count } = await supabaseAdmin
        .from("user_rewards")
        .select("*", { count: "exact", head: true })
        .eq("reward_id", rewardId);
      const claimedCount = count ?? 0;
      if (claimedCount >= rewardRow.quantity_limit) {
        return res.status(400).json({ error: "This reward is sold out" });
      }
    }

    await supabaseAdmin
      .from("users")
      .update({ points: userRow.points - rewardRow.cost, updated_at: new Date().toISOString() })
      .eq("id", userId);

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rewardRow.expiry_days || 30));

    const { data: userReward, error } = await supabaseAdmin
      .from("user_rewards")
      .insert({
        user_id: userId,
        reward_id: rewardId,
        code,
        used: false,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(mapUserReward(userReward));
  } catch (error) {
    res.status(400).json({ error: "Failed to claim reward" });
  }
});

app.get("/api/user-rewards/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { data, error } = await supabaseAdmin
      .from("user_rewards")
      .select("*")
      .eq("user_id", userId)
      .order("claimed_at", { ascending: false });
    if (error) throw error;
    res.json((data ?? []).map(mapUserReward));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user rewards" });
  }
});

// ===== USERS =====
app.get("/api/users/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const id = req.params.id;
    if (authUser.id !== id) {
      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { data: userData, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !userData) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(mapUser(userData));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const id = req.params.id;
    if (authUser.id !== id) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile" });
    }

    const row: any = {};
    if (req.body.firstName !== undefined) row.first_name = req.body.firstName;
    if (req.body.lastName !== undefined) row.last_name = req.body.lastName;
    if (req.body.businessName !== undefined) row.business_name = req.body.businessName;
    if (req.body.businessDescription !== undefined) row.business_description = req.body.businessDescription;
    if (req.body.profileImageUrl !== undefined) row.profile_image_url = req.body.profileImageUrl;
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(mapUser(data));
  } catch (error) {
    res.status(400).json({ error: "Failed to update user" });
  }
});

app.patch("/api/admin/users/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { data: adminUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const id = req.params.id;
    const validRoles = ["tourist", "business", "admin"];
    const row: any = {};
    if (req.body.firstName !== undefined) row.first_name = req.body.firstName;
    if (req.body.lastName !== undefined) row.last_name = req.body.lastName;
    if (req.body.businessName !== undefined) row.business_name = req.body.businessName;
    if (req.body.businessDescription !== undefined) row.business_description = req.body.businessDescription;
    if (req.body.profileImageUrl !== undefined) row.profile_image_url = req.body.profileImageUrl;
    if (req.body.role !== undefined) {
      if (!validRoles.includes(req.body.role)) {
        return res.status(400).json({ error: "Invalid role value" });
      }
      row.role = req.body.role;
    }
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(mapUser(data));
  } catch (error) {
    res.status(400).json({ error: "Failed to update user" });
  }
});

// ===== LEADERBOARD =====
app.get("/api/leaderboard", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, profile_image_url, points, level, role")
      .eq("role", "tourist")
      .order("points", { ascending: false })
      .limit(50);
    if (error) throw error;
    const mapped = (data ?? []).map((r: any) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      profileImageUrl: r.profile_image_url,
      points: r.points,
      level: r.level,
      role: r.role,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ===== ADMIN USERS =====
app.get("/api/admin/users", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { data: adminUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, profile_image_url, points, level, role, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ===== ADMIN USER PROGRESS =====
app.get("/api/admin/user-progress", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { data: adminUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { data: tourists, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, profile_image_url, points, level")
      .eq("role", "tourist")
      .order("points", { ascending: false })
      .limit(50);
    if (usersError) throw usersError;

    const { data: allUserMissions, error: umError } = await supabaseAdmin
      .from("user_missions")
      .select("id, user_id, status");
    if (umError) throw umError;

    const result = (tourists ?? []).map((u: any) => {
      const userUms = (allUserMissions ?? []).filter((um: any) => um.user_id === u.id);
      return {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        profile_image_url: u.profile_image_url,
        points: u.points,
        level: u.level,
        missions_started: userUms.length,
        missions_completed: userUms.filter((um: any) => um.status === "completed").length,
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user progress" });
  }
});

// ===== ADMIN MISSION STATS =====
app.get("/api/admin/mission-stats", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "business")
    ) {
      return res
        .status(403)
        .json({ error: "Admin or business access required" });
    }

    let missionsQuery = supabaseAdmin.from("missions").select("id, title, total_points, status, category, business_id");
    if (currentUser.role !== "admin") {
      missionsQuery = missionsQuery.eq("business_id", currentUser.id);
    }
    const { data: allMissions, error: mError } = await missionsQuery;
    if (mError) throw mError;

    const { data: allUserMissions } = await supabaseAdmin
      .from("user_missions")
      .select("id, user_id, mission_id, status");
    const { data: allSubmissions } = await supabaseAdmin
      .from("submissions")
      .select("id, mission_id, status");

    const stats = (allMissions ?? []).map((m: any) => {
      const mUms = (allUserMissions ?? []).filter((um: any) => um.mission_id === m.id);
      const mSubs = (allSubmissions ?? []).filter((s: any) => s.mission_id === m.id);
      const uniqueStarted = new Set(mUms.map((um: any) => um.user_id));
      const uniqueCompleted = new Set(
        mUms.filter((um: any) => um.status === "completed").map((um: any) => um.user_id)
      );
      return {
        id: m.id,
        title: m.title,
        total_points: m.total_points,
        status: m.status,
        category: m.category,
        users_started: uniqueStarted.size,
        users_completed: uniqueCompleted.size,
        total_submissions: mSubs.length,
        pending_submissions: mSubs.filter((s: any) => s.status === "pending").length,
      };
    });

    stats.sort((a: any, b: any) => b.users_started - a.users_started);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mission stats" });
  }
});

// ===== NOTIFICATIONS =====
app.post("/api/notifications/read-all", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: "Failed to mark all notifications as read",
    });
  }
});

app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json((data ?? []).map(mapNotification));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// ===== USER SUBMISSIONS =====
app.get("/api/user-submissions/:userId/:missionId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const missionId = parseInt(req.params.missionId);
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    res.json((data ?? []).map(mapSubmission));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
});

export default app;
