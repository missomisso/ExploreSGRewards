import express from "express";
import type { Request, Response, NextFunction } from "express";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import * as schema from "../shared/schema.js";
import {
  users,
  missions,
  userMissions,
  submissions,
  rewards,
  userRewards,
  notifications,
  insertMissionSchema,
  insertSubmissionSchema,
  insertRewardSchema,
  insertUserRewardSchema,
} from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;
const isSupabase = connectionString?.includes("supabase");
const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});
const db = drizzle({ client: pool, schema });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    let user;
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          email,
          firstName:
            firstName ||
            supabaseUser.user_metadata?.first_name ||
            existing.firstName,
          lastName:
            lastName ||
            supabaseUser.user_metadata?.last_name ||
            existing.lastName,
          profileImageUrl:
            profileImageUrl ||
            supabaseUser.user_metadata?.avatar_url ||
            existing.profileImageUrl,
        })
        .where(eq(users.id, id))
        .returning();
      user = updated;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          id,
          email,
          firstName:
            firstName ||
            supabaseUser.user_metadata?.first_name ||
            supabaseUser.user_metadata?.full_name?.split(" ")[0] ||
            null,
          lastName:
            lastName ||
            supabaseUser.user_metadata?.last_name ||
            supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
            null,
          profileImageUrl:
            profileImageUrl ||
            supabaseUser.user_metadata?.avatar_url ||
            null,
          role: "tourist",
          level: 1,
          points: 0,
        })
        .returning();
      user = created;
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
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, authUser.id));
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, requestedId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ===== DB CHECK =====
app.get("/api/db-check", async (_req, res) => {
  try {
    const result = await db.execute(sql`select now() as now`);
    const now = (result as any).rows?.[0]?.now ?? (result as any)[0]?.now;
    res.json({ ok: true, now });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
});

app.get("/api/db-tables", async (_req, res) => {
  const result = await db.execute(sql`
    select tablename from pg_tables where schemaname = 'public' order by tablename
  `);
  const rows = (result as any).rows ?? result;
  res.json(rows);
});

// ===== MISSIONS =====
app.get("/api/missions", async (req, res) => {
  try {
    const all = req.query.all === "true";
    if (all) {
      const result = await db
        .select()
        .from(missions)
        .orderBy(desc(missions.createdAt));
      res.json(result);
    } else {
      const result = await db
        .select()
        .from(missions)
        .where(eq(missions.status, "active"))
        .orderBy(desc(missions.createdAt));
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch missions" });
  }
});

app.get("/api/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [mission] = await db
      .select()
      .from(missions)
      .where(eq(missions.id, id));
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mission" });
  }
});

app.post("/api/missions", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.startDate && typeof body.startDate === "string") {
      body.startDate = new Date(body.startDate);
    }
    if (body.endDate && typeof body.endDate === "string") {
      body.endDate = new Date(body.endDate);
    }
    const validated = insertMissionSchema.parse(body);
    const [mission] = await db
      .insert(missions)
      .values(validated as any)
      .returning();
    res.status(201).json(mission);
  } catch (error: any) {
    console.error("Mission creation error:", error?.message || error);
    res.status(400).json({
      error: "Invalid mission data",
      details: error?.errors || error?.message,
    });
  }
});

app.patch("/api/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const allowedFields = [
      "title",
      "description",
      "location",
      "status",
      "tasks",
      "totalPoints",
      "category",
      "startDate",
      "endDate",
    ];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    const [updated] = await db
      .update(missions)
      .set(updateData as any)
      .where(eq(missions.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "Mission not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Failed to update mission" });
  }
});

app.delete("/api/missions/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [mission] = await db
      .select()
      .from(missions)
      .where(eq(missions.id, id));
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!));
    if (user?.role !== "admin" && mission.businessId !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this mission" });
    }
    await db.delete(missions).where(eq(missions.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete mission" });
  }
});

// ===== USER MISSIONS =====
app.post("/api/user-missions", async (req, res) => {
  try {
    const { userId, missionId } = req.body;
    const [existing] = await db
      .select()
      .from(userMissions)
      .where(
        and(
          eq(userMissions.userId, userId),
          eq(userMissions.missionId, missionId)
        )
      );
    if (existing) {
      return res.json(existing);
    }
    const [userMission] = await db
      .insert(userMissions)
      .values({
        userId,
        missionId,
        status: "in_progress",
        completedTasks: [],
      } as any)
      .returning();
    res.status(201).json(userMission);
  } catch (error) {
    res.status(400).json({ error: "Failed to start mission" });
  }
});

app.get("/api/user-missions/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await db
      .select()
      .from(userMissions)
      .where(eq(userMissions.userId, userId));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user missions" });
  }
});

app.patch("/api/user-missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db
      .update(userMissions)
      .set(req.body as any)
      .where(eq(userMissions.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "User mission not found" });
    }
    res.json(updated);
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

    const [mission] = await db
      .select()
      .from(missions)
      .where(eq(missions.id, missionId));
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    const task = mission.tasks.find((t: any) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    let [userMission] = await db
      .select()
      .from(userMissions)
      .where(
        and(
          eq(userMissions.userId, userId),
          eq(userMissions.missionId, missionId)
        )
      );
    if (!userMission) {
      const [created] = await db
        .insert(userMissions)
        .values({
          userId,
          missionId,
          status: "in_progress",
          completedTasks: [],
        } as any)
        .returning();
      userMission = created;
    }

    if (userMission.completedTasks.includes(taskId)) {
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

      const completedTasks = [...userMission.completedTasks, taskId];
      await db
        .update(userMissions)
        .set({ completedTasks } as any)
        .where(eq(userMissions.id, userMission.id));

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      if (user) {
        await db
          .update(users)
          .set({ points: user.points + task.points })
          .where(eq(users.id, userId));
      }

      if (completedTasks.length === mission.tasks.length) {
        await db
          .update(userMissions)
          .set({ status: "completed", completedAt: new Date() } as any)
          .where(eq(userMissions.id, userMission.id));
      }

      return res.json({
        success: true,
        pointsAwarded: task.points,
        autoValidated: true,
        completedTasks,
      });
    } else if (manualReviewTypes.includes(taskType)) {
      const [submission] = await db
        .insert(submissions)
        .values({
          userId,
          missionId,
          taskId,
          type: taskType,
          proofUrl: proofUrl || null,
          status: "pending",
        })
        .returning();

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
    const validated = insertSubmissionSchema.parse(req.body);
    const [submission] = await db
      .insert(submissions)
      .values(validated)
      .returning();
    res.status(201).json(submission);
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

    let result;
    if (missionId && status) {
      result = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.missionId, missionId),
            eq(submissions.status, status)
          )
        )
        .orderBy(desc(submissions.submittedAt));
    } else if (missionId) {
      result = await db
        .select()
        .from(submissions)
        .where(eq(submissions.missionId, missionId))
        .orderBy(desc(submissions.submittedAt));
    } else if (status) {
      result = await db
        .select()
        .from(submissions)
        .where(eq(submissions.status, status))
        .orderBy(desc(submissions.submittedAt));
    } else {
      result = await db
        .select()
        .from(submissions)
        .orderBy(desc(submissions.submittedAt));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

app.patch("/api/submissions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db
      .update(submissions)
      .set(req.body)
      .where(eq(submissions.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const { userId, missionId, taskId } = updated;
    const [mission] = await db
      .select()
      .from(missions)
      .where(eq(missions.id, missionId));
    const task = mission?.tasks.find((t: any) => t.id === taskId);

    if (req.body.status === "approved") {
      if (mission && task) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        if (user) {
          await db
            .update(users)
            .set({ points: user.points + task.points })
            .where(eq(users.id, userId));
        }

        await db.insert(notifications).values({
          userId,
          type: "submission_approved",
          title: "Task Approved!",
          message: `Your submission for ${task.title} has been approved. You earned ${task.points} points!`,
          read: false,
          relatedId: missionId,
        });

        let [um] = await db
          .select()
          .from(userMissions)
          .where(
            and(
              eq(userMissions.userId, userId),
              eq(userMissions.missionId, missionId)
            )
          );
        if (!um) {
          const [created] = await db
            .insert(userMissions)
            .values({
              userId,
              missionId,
              status: "in_progress",
              completedTasks: [],
            } as any)
            .returning();
          um = created;
        }

        const completedTasks = [...um.completedTasks, taskId];
        await db
          .update(userMissions)
          .set({ completedTasks } as any)
          .where(eq(userMissions.id, um.id));

        if (completedTasks.length === mission.tasks.length) {
          await db
            .update(userMissions)
            .set({ status: "completed", completedAt: new Date() } as any)
            .where(eq(userMissions.id, um.id));

          await db.insert(notifications).values({
            userId,
            type: "mission_completed",
            title: "Mission Complete!",
            message: `Congratulations! You completed ${mission.title} and earned ${mission.totalPoints} points!`,
            read: false,
            relatedId: missionId,
          });
        }
      }
    } else if (req.body.status === "rejected") {
      if (task) {
        const reviewNote = req.body.reviewNote || updated.reviewNote;
        await db.insert(notifications).values({
          userId,
          type: "submission_rejected",
          title: "Submission Rejected",
          message: `Your submission for ${task.title} was not approved.${reviewNote ? ` ${reviewNote}` : ""}`,
          read: false,
          relatedId: missionId,
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
    const result = await db.execute(sql`
      SELECT 
        r.*,
        COALESCE(COUNT(ur.id), 0) as claimed_count
      FROM rewards r
      LEFT JOIN user_rewards ur ON r.id = ur.reward_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    const rewardsList = ((result as any).rows || result).map((r: any) => ({
      ...r,
      claimedCount: Number(r.claimed_count) || 0,
      remainingQuantity: r.quantity_limit
        ? Math.max(0, r.quantity_limit - (Number(r.claimed_count) || 0))
        : null,
      isSoldOut: r.quantity_limit
        ? (Number(r.claimed_count) || 0) >= r.quantity_limit
        : false,
    }));
    res.json(rewardsList);
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
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "business")
    ) {
      return res
        .status(403)
        .json({ error: "Admin or business access required" });
    }

    const validated = insertRewardSchema.parse({
      ...req.body,
      businessId:
        currentUser.role === "business" ? authUser.id : req.body.businessId,
      merchant:
        currentUser.role === "business"
          ? currentUser.businessName || req.body.merchant
          : req.body.merchant,
    });
    const [reward] = await db.insert(rewards).values(validated).returning();
    res.status(201).json(reward);
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
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "business")
    ) {
      return res
        .status(403)
        .json({ error: "Admin or business access required" });
    }

    const id = parseInt(req.params.id);
    const [reward] = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, id));
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }
    if (currentUser.role === "business" && reward.businessId !== authUser.id) {
      return res
        .status(403)
        .json({ error: "Cannot delete other businesses' rewards" });
    }

    await db.delete(rewards).where(eq(rewards.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete reward" });
  }
});

app.post("/api/rewards/claim", async (req, res) => {
  try {
    const { userId, rewardId } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    const [reward] = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, rewardId));

    if (!user || !reward) {
      return res.status(404).json({ error: "User or reward not found" });
    }

    if (user.points < reward.cost) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    if (reward.quantityLimit) {
      const claimedResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM user_rewards WHERE reward_id = ${rewardId}`
      );
      const claimedCount = Number(
        ((claimedResult as any).rows || claimedResult)[0]?.count || 0
      );
      if (claimedCount >= reward.quantityLimit) {
        return res.status(400).json({ error: "This reward is sold out" });
      }
    }

    await db
      .update(users)
      .set({ points: user.points - reward.cost })
      .where(eq(users.id, userId));

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (reward.expiryDays || 30));

    const [userReward] = await db
      .insert(userRewards)
      .values({ userId, rewardId, code, used: false, expiresAt })
      .returning();

    res.status(201).json(userReward);
  } catch (error) {
    res.status(400).json({ error: "Failed to claim reward" });
  }
});

app.get("/api/user-rewards/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.userId, userId))
      .orderBy(desc(userRewards.claimedAt));
    res.json(result);
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
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, authUser.id));
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
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

    const allowedFields = [
      "firstName",
      "lastName",
      "businessName",
      "businessDescription",
      "profileImageUrl",
    ];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated);
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
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const id = req.params.id;
    const allowedFields = [
      "firstName",
      "lastName",
      "businessName",
      "businessDescription",
      "profileImageUrl",
      "role",
    ];
    const validRoles = ["tourist", "business", "admin"];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "role" && !validRoles.includes(req.body[field])) {
          return res.status(400).json({ error: "Invalid role value" });
        }
        updateData[field] = req.body[field];
      }
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Failed to update user" });
  }
});

// ===== LEADERBOARD =====
app.get("/api/leaderboard", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, first_name, last_name, profile_image_url, points, level, role
      FROM users
      WHERE role = 'tourist'
      ORDER BY points DESC
      LIMIT 50
    `);
    const usersList = (result as any).rows || result;
    res.json(usersList);
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
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const result = await db.execute(sql`
      SELECT id, first_name, last_name, email, profile_image_url, points, level, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `);
    const usersList = (result as any).rows || result;
    res.json(usersList);
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
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const result = await db.execute(sql`
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.profile_image_url, u.points, u.level,
        COUNT(DISTINCT um.id) as missions_started,
        COUNT(DISTINCT CASE WHEN um.status = 'completed' THEN um.id END) as missions_completed
      FROM users u
      LEFT JOIN user_missions um ON u.id = um.user_id
      WHERE u.role = 'tourist'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.profile_image_url, u.points, u.level
      ORDER BY u.points DESC
      LIMIT 50
    `);
    const usersList = (result as any).rows || result;
    res.json(usersList);
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
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "business")
    ) {
      return res
        .status(403)
        .json({ error: "Admin or business access required" });
    }

    let result;
    if (currentUser.role === "admin") {
      result = await db.execute(sql`
        SELECT 
          m.id, m.title, m.total_points, m.status, m.category,
          COUNT(DISTINCT um.user_id) as users_started,
          COUNT(DISTINCT CASE WHEN um.status = 'completed' THEN um.user_id END) as users_completed,
          COUNT(DISTINCT s.id) as total_submissions,
          COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) as pending_submissions
        FROM missions m
        LEFT JOIN user_missions um ON m.id = um.mission_id
        LEFT JOIN submissions s ON m.id = s.mission_id
        GROUP BY m.id, m.title, m.total_points, m.status, m.category
        ORDER BY users_started DESC
      `);
    } else {
      result = await db.execute(sql`
        SELECT 
          m.id, m.title, m.total_points, m.status, m.category,
          COUNT(DISTINCT um.user_id) as users_started,
          COUNT(DISTINCT CASE WHEN um.status = 'completed' THEN um.user_id END) as users_completed,
          COUNT(DISTINCT s.id) as total_submissions,
          COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) as pending_submissions
        FROM missions m
        LEFT JOIN user_missions um ON m.id = um.mission_id
        LEFT JOIN submissions s ON m.id = s.mission_id
        WHERE m.business_id = ${currentUser.id}
        GROUP BY m.id, m.title, m.total_points, m.status, m.category
        ORDER BY users_started DESC
      `);
    }
    const stats = (result as any).rows || result;
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
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
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
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
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
    const result = await db
      .select()
      .from(submissions)
      .where(
        and(eq(submissions.userId, userId), eq(submissions.missionId, missionId))
      )
      .orderBy(desc(submissions.submittedAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
});

export default app;
