import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { sbStorage } from "./supabaseStorage";
import { verifySupabaseToken, supabaseAdmin } from "./supabase";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ===== SUPABASE CONFIG (for client-side) =====
  app.get("/api/config/supabase", (_req, res) => {
    res.json({
      url: process.env.SUPABASE_URL || "",
      anonKey: process.env.SUPABASE_ANON_KEY || "",
    });
  });

  // ===== SUPABASE AUTH SYNC =====
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

      let user = await sbStorage.getUser(id);

      if (user) {
        user = await sbStorage.updateUser(id, {
          email,
          firstName: firstName || supabaseUser.user_metadata?.first_name || user.firstName,
          lastName: lastName || supabaseUser.user_metadata?.last_name || user.lastName,
          profileImageUrl: profileImageUrl || supabaseUser.user_metadata?.avatar_url || user.profileImageUrl,
        });
      } else {
        user = await sbStorage.createUser({
          id,
          email,
          firstName: firstName || supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.full_name?.split(" ")[0] || null,
          lastName: lastName || supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null,
          profileImageUrl: profileImageUrl || supabaseUser.user_metadata?.avatar_url || null,
          role: "tourist",
          level: 1,
          points: 0,
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  app.get("/api/auth/user/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const token = authHeader.substring(7);
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      
      const requestedId = req.params.id;
      if (authUser.id !== requestedId) {
        const currentUser = await sbStorage.getUser(authUser.id);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const user = await sbStorage.getUser(requestedId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ===== DB CHECK (Supabase connectivity) =====
  app.get("/api/db-check", async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
      if (error) throw error;
      res.json({ ok: true, connected: true });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message ?? String(err),
      });
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
      const missions = await sbStorage.getMissions(!all);
      res.json(missions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  app.get("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mission = await sbStorage.getMission(id);
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
      if (body.startDate && typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      if (body.endDate && typeof body.endDate === 'string') {
        body.endDate = new Date(body.endDate);
      }
      const mission = await sbStorage.createMission(body);
      res.status(201).json(mission);
    } catch (error: any) {
      console.error("Mission creation error:", error?.message || error);
      res.status(400).json({ error: "Invalid mission data", details: error?.message });
    }
  });

  app.patch("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const allowedFields = ["title", "description", "location", "status", "tasks", "totalPoints", "category", "startDate", "endDate"];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      const updated = await sbStorage.updateMission(id, updateData);
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
      const mission = await sbStorage.getMission(id);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      const user = await sbStorage.getUser(req.userId!);
      if (user?.role !== "admin" && mission.businessId !== req.userId) {
        return res.status(403).json({ error: "Not authorized to delete this mission" });
      }
      await sbStorage.deleteMission(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mission" });
    }
  });

  // ===== USER MISSIONS (Progress Tracking) =====
  app.post("/api/user-missions", async (req, res) => {
    try {
      const { userId, missionId } = req.body;
      
      const existing = await sbStorage.getUserMission(userId, missionId);
      if (existing) {
        return res.json(existing);
      }

      const userMission = await sbStorage.createUserMission({
        userId,
        missionId,
        status: "in_progress",
        completedTasks: [],
      });
      res.status(201).json(userMission);
    } catch (error) {
      res.status(400).json({ error: "Failed to start mission" });
    }
  });

  app.get("/api/user-missions/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const userMissions = await sbStorage.getUserMissions(userId);
      res.json(userMissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user missions" });
    }
  });

  app.patch("/api/user-missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await sbStorage.updateUserMission(id, req.body);
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

      const mission = await sbStorage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }

      const task = mission.tasks.find((t: any) => t.id === taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      let userMission = await sbStorage.getUserMission(userId, missionId);
      if (!userMission) {
        userMission = await sbStorage.createUserMission({
          userId,
          missionId,
          status: "in_progress",
          completedTasks: [],
        });
      }

      if (userMission!.completedTasks.includes(taskId)) {
        return res.status(400).json({ error: "Task already completed" });
      }

      const autoValidatedTypes = ["gps", "quiz", "qrcode"];
      const manualReviewTypes = ["photo", "receipt"];

      if (autoValidatedTypes.includes(taskType)) {
        let isValid = true;

        if (taskType === "quiz") {
          const correctAnswer = (task as any).correctAnswer;
          const userAnswer = parseInt(answer);
          isValid = correctAnswer === userAnswer;
          
          if (!isValid) {
            return res.status(400).json({ error: "Incorrect answer", valid: false });
          }
        }

        const completedTasks = [...userMission!.completedTasks, taskId];
        await sbStorage.updateUserMission(userMission!.id, { completedTasks });

        const user = await sbStorage.getUser(userId);
        if (user) {
          await sbStorage.updateUserPoints(userId, user.points + task.points);
        }

        if (completedTasks.length === mission.tasks.length) {
          await sbStorage.updateUserMission(userMission!.id, {
            status: "completed",
            completedAt: new Date(),
          });
        }

        return res.json({ 
          success: true, 
          pointsAwarded: task.points,
          autoValidated: true,
          completedTasks 
        });

      } else if (manualReviewTypes.includes(taskType)) {
        const submission = await sbStorage.createSubmission({
          userId,
          missionId,
          taskId,
          type: taskType,
          proofUrl: proofUrl || null,
          status: "pending",
        });

        return res.json({ 
          success: true, 
          pendingReview: true,
          submissionId: submission!.id,
          message: "Your submission is pending review"
        });
      }

      return res.status(400).json({ error: "Unknown task type" });
    } catch (error) {
      console.error("Task completion error:", error);
      res.status(500).json({ error: "Failed to complete task" });
    }
  });

  // ===== SUBMISSIONS (Task Verification) =====
  app.post("/api/submissions", async (req, res) => {
    try {
      const submission = await sbStorage.createSubmission(req.body);
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ error: "Invalid submission data" });
    }
  });

  app.get("/api/submissions", async (req, res) => {
    try {
      const missionId = req.query.missionId ? parseInt(req.query.missionId as string) : undefined;
      const status = req.query.status as string | undefined;
      const submissions = await sbStorage.getSubmissions(missionId, status);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.patch("/api/submissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await sbStorage.updateSubmission(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const { userId, missionId, taskId } = updated;
      const mission = await sbStorage.getMission(missionId);
      const task = mission?.tasks.find((t: any) => t.id === taskId);

      if (req.body.status === "approved") {
        if (mission && task) {
          const user = await sbStorage.getUser(userId);
          if (user) {
            await sbStorage.updateUserPoints(userId, user.points + task.points);
          }

          await sbStorage.createNotification({
            userId,
            type: "submission_approved",
            title: "Task Approved!",
            message: `Your submission for ${task.title} has been approved. You earned ${task.points} points!`,
            read: false,
            relatedId: missionId,
          });

          let userMission = await sbStorage.getUserMission(userId, missionId);
          if (!userMission) {
            userMission = await sbStorage.createUserMission({
              userId,
              missionId,
              status: "in_progress",
              completedTasks: [],
            });
          }
          
          const completedTasks = [...userMission!.completedTasks, taskId];
          await sbStorage.updateUserMission(userMission!.id, { completedTasks });

          if (completedTasks.length === mission.tasks.length) {
            await sbStorage.updateUserMission(userMission!.id, {
              status: "completed",
              completedAt: new Date(),
            });

            await sbStorage.createNotification({
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
          await sbStorage.createNotification({
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
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewardsWithCounts = await sbStorage.getRewardsWithCounts();
      res.json(rewardsWithCounts);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const currentUser = await sbStorage.getUser(authUser.id);
      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "business")) {
        return res.status(403).json({ error: "Admin or business access required" });
      }

      const rewardData = {
        ...req.body,
        businessId: currentUser.role === "business" ? authUser.id : req.body.businessId,
        merchant: currentUser.role === "business" ? (currentUser.businessName || req.body.merchant) : req.body.merchant,
      };
      const reward = await sbStorage.createReward(rewardData);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const currentUser = await sbStorage.getUser(authUser.id);
      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "business")) {
        return res.status(403).json({ error: "Admin or business access required" });
      }

      const id = parseInt(req.params.id);
      const reward = await sbStorage.getReward(id);
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }
      if (currentUser.role === "business" && reward.businessId !== authUser.id) {
        return res.status(403).json({ error: "Cannot delete other businesses' rewards" });
      }

      await sbStorage.deleteReward(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reward" });
    }
  });

  app.post("/api/rewards/claim", async (req, res) => {
    try {
      const { userId, rewardId } = req.body;

      const user = await sbStorage.getUser(userId);
      const reward = await sbStorage.getReward(rewardId);

      if (!user || !reward) {
        return res.status(404).json({ error: "User or reward not found" });
      }

      if (user.points < reward.cost) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      if (reward.quantityLimit) {
        const claimedCount = await sbStorage.getClaimedCount(rewardId);
        if (claimedCount >= reward.quantityLimit) {
          return res.status(400).json({ error: "This reward is sold out" });
        }
      }

      await sbStorage.updateUserPoints(userId, user.points - reward.cost);

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (reward.expiryDays || 30));

      const userReward = await sbStorage.createUserReward({
        userId,
        rewardId,
        code,
        used: false,
        expiresAt,
      });

      res.status(201).json(userReward);
    } catch (error) {
      res.status(400).json({ error: "Failed to claim reward" });
    }
  });

  app.get("/api/user-rewards/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const userRewards = await sbStorage.getUserRewards(userId);
      res.json(userRewards);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      
      const id = req.params.id;
      if (authUser.id !== id) {
        const currentUser = await sbStorage.getUser(authUser.id);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const user = await sbStorage.getUser(id);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      
      const id = req.params.id;
      if (authUser.id !== id) {
        return res.status(403).json({ error: "You can only update your own profile" });
      }

      const allowedFields = ["firstName", "lastName", "businessName", "businessDescription", "profileImageUrl"];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      const updated = await sbStorage.updateUser(id, updateData);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const adminUser = await sbStorage.getUser(authUser.id);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const id = req.params.id;
      const allowedFields = ["firstName", "lastName", "businessName", "businessDescription", "profileImageUrl", "role"];
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
      
      const updated = await sbStorage.updateUser(id, updateData);
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
      const users = await sbStorage.getLeaderboard();
      res.json(users);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const adminUser = await sbStorage.getUser(authUser.id);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const users = await sbStorage.getAllUsers();
      res.json(users);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const adminUser = await sbStorage.getUser(authUser.id);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { data: tourists, error: tError } = await supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, email, profile_image_url, points, level")
        .eq("role", "tourist")
        .order("points", { ascending: false })
        .limit(50);
      if (tError) throw tError;

      const results = [];
      for (const t of (tourists ?? [])) {
        const { data: ums } = await supabaseAdmin
          .from("user_missions")
          .select("id, status")
          .eq("user_id", t.id);
        const missionsStarted = ums?.length ?? 0;
        const missionsCompleted = ums?.filter((um: any) => um.status === "completed").length ?? 0;
        results.push({
          ...t,
          missions_started: missionsStarted,
          missions_completed: missionsCompleted,
        });
      }
      res.json(results);
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
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const currentUser = await sbStorage.getUser(authUser.id);
      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "business")) {
        return res.status(403).json({ error: "Admin or business access required" });
      }

      let missionQuery = supabaseAdmin.from("missions").select("id, title, total_points, status, category, business_id");
      if (currentUser.role === "business") {
        missionQuery = missionQuery.eq("business_id", currentUser.id);
      }
      const { data: missionsList, error: mErr } = await missionQuery;
      if (mErr) throw mErr;

      const results = [];
      for (const m of (missionsList ?? [])) {
        const { data: ums } = await supabaseAdmin
          .from("user_missions")
          .select("user_id, status")
          .eq("mission_id", m.id);
        const { data: subs } = await supabaseAdmin
          .from("submissions")
          .select("id, status")
          .eq("mission_id", m.id);

        results.push({
          id: m.id,
          title: m.title,
          total_points: m.total_points,
          status: m.status,
          category: m.category,
          users_started: ums?.length ?? 0,
          users_completed: ums?.filter((u: any) => u.status === "completed").length ?? 0,
          total_submissions: subs?.length ?? 0,
          pending_submissions: subs?.filter((s: any) => s.status === "pending").length ?? 0,
        });
      }
      res.json(results);
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
      await sbStorage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const notifications = await sbStorage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await sbStorage.markNotificationRead(id);
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
      const submissions = await sbStorage.getUserSubmissions(userId, missionId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user submissions" });
    }
  });

  return httpServer;
}
