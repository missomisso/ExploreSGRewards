import { Router } from "express";
import { sbStorage } from "../storage";
import { verifySupabaseToken, supabaseAdmin } from "../supabase";

export const authRouter = Router();

authRouter.get("/config/supabase", (_req, res) => {
  res.json({
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

authRouter.post("/auth/sync", async (req, res) => {
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

authRouter.get("/auth/user/:id", async (req, res) => {
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

authRouter.get("/db-check", async (_req, res) => {
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

authRouter.get("/db-tables", async (_req, res) => {
  try {
    const tables = ["users", "missions", "user_missions", "submissions", "rewards", "user_rewards", "notifications"];
    res.json(tables.map(t => ({ tablename: t })));
  } catch (error) {
    res.status(500).json({ error: "Failed to list tables" });
  }
});
