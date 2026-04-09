import { Router } from "express";
import { sbStorage } from "../storage";
import { supabaseAdmin } from "../supabase";

export const usersRouter = Router();

usersRouter.get("/users/:id", async (req, res) => {
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

usersRouter.patch("/users/:id", async (req, res) => {
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

usersRouter.get("/leaderboard", async (_req, res) => {
  try {
    const users = await sbStorage.getLeaderboard();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
