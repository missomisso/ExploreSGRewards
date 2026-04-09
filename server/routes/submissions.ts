import { Router } from "express";
import { sbStorage } from "../storage";

export const submissionsRouter = Router();

submissionsRouter.post("/submissions", async (req, res) => {
  try {
    const submission = await sbStorage.createSubmission(req.body);
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ error: "Invalid submission data" });
  }
});

submissionsRouter.get("/submissions", async (req, res) => {
  try {
    const missionId = req.query.missionId ? parseInt(req.query.missionId as string) : undefined;
    const status = req.query.status as string | undefined;
    const submissions = await sbStorage.getSubmissions(missionId, status);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

submissionsRouter.patch("/submissions/:id", async (req, res) => {
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

submissionsRouter.get("/user-submissions/:userId/:missionId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const missionId = parseInt(req.params.missionId);
    const submissions = await sbStorage.getUserSubmissions(userId, missionId);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
});
