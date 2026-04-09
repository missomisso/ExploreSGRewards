import { Router } from "express";
import { sbStorage } from "../storage";
import { requireAuth } from "../utils/auth";

export const missionsRouter = Router();

missionsRouter.get("/missions", async (req, res) => {
  try {
    const all = req.query.all === "true";
    const missions = await sbStorage.getMissions(!all);
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch missions" });
  }
});

missionsRouter.get("/missions/:id", async (req, res) => {
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

missionsRouter.post("/missions", async (req, res) => {
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

missionsRouter.patch("/missions/:id", async (req, res) => {
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

missionsRouter.delete("/missions/:id", requireAuth, async (req, res) => {
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

missionsRouter.post("/user-missions", async (req, res) => {
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

missionsRouter.get("/user-missions/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const userMissions = await sbStorage.getUserMissions(userId);
    res.json(userMissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user missions" });
  }
});

missionsRouter.patch("/user-missions/:id", async (req, res) => {
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

missionsRouter.post("/tasks/complete", async (req, res) => {
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
