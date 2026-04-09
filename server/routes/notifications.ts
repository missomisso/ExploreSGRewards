import { Router } from "express";
import { sbStorage } from "../storage";

export const notificationsRouter = Router();

notificationsRouter.post("/notifications/read-all", async (req, res) => {
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

notificationsRouter.get("/notifications/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const notifications = await sbStorage.getNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

notificationsRouter.post("/notifications/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await sbStorage.markNotificationRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});
