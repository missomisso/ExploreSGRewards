import { Router } from "express";
import { sbStorage } from "../storage";
import { supabaseAdmin } from "../supabase";

export const adminRouter = Router();

adminRouter.patch("/admin/users/:id", async (req, res) => {
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

adminRouter.get("/admin/users", async (req, res) => {
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

adminRouter.get("/admin/user-progress", async (req, res) => {
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

adminRouter.get("/admin/mission-stats", async (req, res) => {
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
