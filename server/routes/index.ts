import type { Express } from "express";
import type { Server } from "http";

import { authRouter } from "./auth.js";
import { usersRouter } from "./users.js";
import { missionsRouter } from "./missions.js";
import { submissionsRouter } from "./submissions.js";
import { rewardsRouter } from "./rewards.js";
import { adminRouter } from "./admin.js";
import { notificationsRouter } from "./notifications.js";

export async function registerRoutes(
  httpServer: Server | null,
  app: Express
): Promise<Server | null> {
  app.use("/api", authRouter);
  app.use("/api", usersRouter);
  app.use("/api", missionsRouter);
  app.use("/api", submissionsRouter);
  app.use("/api", rewardsRouter);
  app.use("/api", adminRouter);
  app.use("/api", notificationsRouter);

  return httpServer;
}
