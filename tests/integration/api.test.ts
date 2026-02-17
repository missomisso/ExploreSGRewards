import { describe, it, expect } from "vitest";
import express from "express";
import { createServer } from "http";
import request from "supertest";

function createTestApp() {
  const app = express();
  app.use(express.json());

  const missions = [
    {
      id: 1,
      title: "Explore Marina Bay",
      description: "Visit iconic landmarks around Marina Bay",
      location: "Marina Bay, Singapore",
      totalPoints: 150,
      category: "exploration",
      status: "active",
      tasks: [
        { id: "t1", title: "Visit Merlion", points: 50, type: "gps" },
        { id: "t2", title: "Photo at ArtScience Museum", points: 100, type: "photo" },
      ],
    },
    {
      id: 2,
      title: "Hawker Food Trail",
      description: "Try local dishes at famous hawker centres",
      location: "Various Locations",
      totalPoints: 200,
      category: "food",
      status: "active",
      tasks: [],
    },
  ];

  const rewards = [
    {
      id: 1,
      title: "Free Coffee",
      description: "Enjoy a free coffee at any partner café",
      cost: 100,
      merchant: "SG Coffee Co",
      category: "Food",
      quantityLimit: 50,
      expiryDays: 30,
    },
  ];

  app.get("/api/missions", (_req, res) => {
    res.json(missions);
  });

  app.get("/api/missions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const mission = missions.find((m) => m.id === id);
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }
    res.json(mission);
  });

  app.get("/api/rewards", (_req, res) => {
    res.json(rewards);
  });

  app.post("/api/rewards/claim", (req, res) => {
    const { userId, rewardId } = req.body;
    if (!userId || !rewardId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) {
      return res.status(404).json({ error: "User or reward not found" });
    }
    res.status(201).json({
      id: 99,
      userId,
      rewardId,
      code: "TESTCODE1",
      used: false,
      expiresAt: new Date().toISOString(),
    });
  });

  return app;
}

describe("GET /api/missions – Integration Test", () => {
  const app = createTestApp();

  it("returns 200 and an array of missions", async () => {
    // Arrange & Act
    const res = await request(app).get("/api/missions");

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("each mission has the expected structure", async () => {
    // Arrange & Act
    const res = await request(app).get("/api/missions");

    // Assert
    const mission = res.body[0];
    expect(mission).toHaveProperty("id");
    expect(mission).toHaveProperty("title");
    expect(mission).toHaveProperty("description");
    expect(mission).toHaveProperty("totalPoints");
    expect(mission).toHaveProperty("category");
    expect(mission).toHaveProperty("tasks");
    expect(Array.isArray(mission.tasks)).toBe(true);
  });
});

describe("GET /api/missions/:id – Integration Test", () => {
  const app = createTestApp();

  it("returns 200 and the correct mission for a valid ID", async () => {
    // Arrange & Act
    const res = await request(app).get("/api/missions/1");

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBe("Explore Marina Bay");
    expect(res.body.tasks).toHaveLength(2);
  });

  it("returns 404 for a non-existent mission", async () => {
    // Arrange & Act
    const res = await request(app).get("/api/missions/999");

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toBe("Mission not found");
  });
});

describe("GET /api/rewards – Integration Test", () => {
  const app = createTestApp();

  it("returns 200 and an array of rewards", async () => {
    const res = await request(app).get("/api/rewards");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("cost");
    expect(res.body[0]).toHaveProperty("merchant");
  });
});

describe("POST /api/rewards/claim – Integration Test", () => {
  const app = createTestApp();

  it("returns 201 with a claimed reward on valid request", async () => {
    // Arrange & Act
    const res = await request(app)
      .post("/api/rewards/claim")
      .send({ userId: "user-1", rewardId: 1 });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("code");
    expect(res.body).toHaveProperty("used", false);
    expect(res.body.userId).toBe("user-1");
    expect(res.body.rewardId).toBe(1);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/rewards/claim")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 404 for a non-existent reward", async () => {
    const res = await request(app)
      .post("/api/rewards/claim")
      .send({ userId: "user-1", rewardId: 999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });
});
