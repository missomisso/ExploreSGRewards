import { Router } from "express";
import { sbStorage } from "../storage";
import { supabaseAdmin } from "../supabase";

export const rewardsRouter = Router();

rewardsRouter.get("/rewards", async (req, res) => {
  try {
    const rewardsWithCounts = await sbStorage.getRewardsWithCounts();
    res.json(rewardsWithCounts);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

rewardsRouter.post("/rewards", async (req, res) => {
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

rewardsRouter.delete("/rewards/:id", async (req, res) => {
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

rewardsRouter.post("/rewards/claim", async (req, res) => {
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

rewardsRouter.get("/user-rewards/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const userRewards = await sbStorage.getUserRewards(userId);
    res.json(userRewards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user rewards" });
  }
});
