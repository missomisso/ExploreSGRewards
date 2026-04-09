import type { Express } from "express";
import type { Server } from "http";

import { authRouter } from "./auth";
import { usersRouter } from "./users";
import { missionsRouter } from "./missions";
import { submissionsRouter } from "./submissions";
import { rewardsRouter } from "./rewards";
import { adminRouter } from "./admin";
import { notificationsRouter } from "./notifications";

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
