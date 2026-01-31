import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema, insertSubmissionSchema, insertRewardSchema, insertUserRewardSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

import { sql } from "drizzle-orm";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

    // ===== DB CHECK (Supabase connectivity) =====
  app.get("/api/db-check", async (_req, res) => {
    try {
      const result = await db.execute(sql`select now() as now`);
      const now = (result as any).rows?.[0]?.now ?? (result as any)[0]?.now;
      res.json({ ok: true, now });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message ?? String(err),
      });
    }
  });

    app.get("/api/db-tables", async (_req, res) => {
    const result = await db.execute(sql`
      select tablename
      from pg_tables
      where schemaname = 'public'
      order by tablename
    `);

    const rows = (result as any).rows ?? result;
    res.json(rows);
  });


  
  // ===== MISSIONS =====
  app.get("/api/missions", async (req, res) => {
    try {
      const missions = await storage.getMissions();
      res.json(missions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  app.get("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mission = await storage.getMission(id);
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
      const validated = insertMissionSchema.parse(req.body);
      const mission = await storage.createMission(validated);
      res.status(201).json(mission);
    } catch (error) {
      res.status(400).json({ error: "Invalid mission data" });
    }
  });

  // ===== USER MISSIONS (Progress Tracking) =====
  app.post("/api/user-missions", async (req, res) => {
    try {
      const { userId, missionId } = req.body;
      
      // Check if user mission already exists
      const existing = await storage.getUserMission(userId, missionId);
      if (existing) {
        return res.json(existing);
      }

      const userMission = await storage.createUserMission({
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
      const userMissions = await storage.getUserMissions(userId);
      res.json(userMissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user missions" });
    }
  });

  app.patch("/api/user-missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateUserMission(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "User mission not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update user mission" });
    }
  });

  // ===== SUBMISSIONS (Task Verification) =====
  app.post("/api/submissions", async (req, res) => {
    try {
      const validated = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validated);
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ error: "Invalid submission data" });
    }
  });

  app.get("/api/submissions", async (req, res) => {
    try {
      const missionId = req.query.missionId ? parseInt(req.query.missionId as string) : undefined;
      const status = req.query.status as string | undefined;
      const submissions = await storage.getSubmissions(missionId, status);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.patch("/api/submissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateSubmission(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // If submission approved, update user mission progress
      if (req.body.status === "approved") {
        const { userId, missionId, taskId } = updated;
        const userMission = await storage.getUserMission(userId, missionId);
        
        if (userMission) {
          const completedTasks = [...userMission.completedTasks, taskId];
          await storage.updateUserMission(userMission.id, { completedTasks });

          // Check if all tasks completed
          const mission = await storage.getMission(missionId);
          if (mission && completedTasks.length === mission.tasks.length) {
            await storage.updateUserMission(userMission.id, {
              status: "completed",
              completedAt: new Date(),
            });

            // Award points
            const user = await storage.getUser(userId);
            if (user) {
              await storage.updateUserPoints(userId, user.points + mission.totalPoints);
            }
          }
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
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  app.post("/api/rewards", async (req, res) => {
    try {
      const validated = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(validated);
      res.status(201).json(reward);
    } catch (error) {
      res.status(400).json({ error: "Invalid reward data" });
    }
  });

  app.post("/api/rewards/claim", async (req, res) => {
    try {
      const { userId, rewardId } = req.body;

      const user = await storage.getUser(userId);
      const reward = await storage.getReward(rewardId);

      if (!user || !reward) {
        return res.status(404).json({ error: "User or reward not found" });
      }

      if (user.points < reward.cost) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      // Deduct points
      await storage.updateUserPoints(userId, user.points - reward.cost);

      // Generate code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (reward.expiryDays || 30));

      const userReward = await storage.createUserReward({
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
      const userRewards = await storage.getUserRewards(userId);
      res.json(userRewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user rewards" });
    }
  });

  // ===== USERS =====
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  return httpServer;
}
