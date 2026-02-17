/**
 * Part B: Integration Tests — API Endpoints
 *
 * Uses Supertest to send real HTTP requests to the Express app
 * and verify status codes + response body structure.
 *
 * Endpoints tested:
 *   - GET  /api/missions         (list all active missions)
 *   - GET  /api/missions/:id     (single mission detail)
 *   - POST /api/user-missions    (start a mission)
 *   - GET  /api/config/supabase  (client configuration)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer } from "http";
import request from "supertest";

let app: express.Express;
let httpServer: ReturnType<typeof createServer>;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  httpServer = createServer(app);

  const { registerRoutes } = await import("../../server/routes");
  await registerRoutes(httpServer, app);
});

afterAll(() => {
  httpServer.close();
});

describe("GET /api/missions", () => {
  it("should return 200 and an array of missions", async () => {
    const res = await request(app).get("/api/missions");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("each mission should have required fields (id, title, tasks, totalPoints)", async () => {
    const res = await request(app).get("/api/missions");
    const mission = res.body[0];

    expect(mission).toHaveProperty("id");
    expect(mission).toHaveProperty("title");
    expect(mission).toHaveProperty("tasks");
    expect(mission).toHaveProperty("totalPoints");
    expect(typeof mission.id).toBe("number");
    expect(typeof mission.title).toBe("string");
    expect(Array.isArray(mission.tasks)).toBe(true);
  });
});

describe("GET /api/missions/:id", () => {
  it("should return 200 and the mission detail for a valid ID", async () => {
    const res = await request(app).get("/api/missions/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("tasks");
    expect(res.body.title).toBe("Marina Bay Discovery");
  });

  it("should return 404 for a non-existent mission ID", async () => {
    const res = await request(app).get("/api/missions/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /api/user-missions", () => {
  it("should return a user-mission object with correct structure", async () => {
    const res = await request(app)
      .post("/api/user-missions")
      .send({ userId: "41e547af-9b14-4773-94f5-32b36180fa9b", missionId: 1 });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("userId");
    expect(res.body).toHaveProperty("missionId");
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("completedTasks");
  });

  it("should return 400 when request body is invalid", async () => {
    const res = await request(app)
      .post("/api/user-missions")
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("GET /api/config/supabase", () => {
  it("should return 200 with url and anonKey fields", async () => {
    const res = await request(app).get("/api/config/supabase");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("url");
    expect(res.body).toHaveProperty("anonKey");
    expect(typeof res.body.url).toBe("string");
    expect(typeof res.body.anonKey).toBe("string");
  });
});
