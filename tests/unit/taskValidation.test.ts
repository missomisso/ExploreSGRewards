/**
 * Part A: Unit Tests — Task Completion & Validation Logic
 *
 * Tests the core business logic used when a tourist completes a task
 * within a mission (quiz validation, task deduplication, point awarding).
 *
 * Techniques demonstrated:
 *   - Mock  : Supabase storage layer is mocked to isolate logic
 *   - Spy   : vi.spyOn verifies that specific storage functions are called
 *   - Stub  : Fixed test data is provided via vi.fn().mockResolvedValue
 *   - AAA   : Every test follows Arrange → Act → Assert
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// We extract and replicate the pure business logic from server/routes.ts
// so we can test it in isolation without spinning up an Express server.
// ---------------------------------------------------------------------------

interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  correctAnswer?: number;
}

interface Mission {
  id: number;
  title: string;
  tasks: Task[];
}

interface UserMission {
  id: number;
  userId: string;
  missionId: number;
  status: string;
  completedTasks: string[];
}

// Mock storage interface (Stub)
const mockStorage = {
  getMission: vi.fn(),
  getUserMission: vi.fn(),
  createUserMission: vi.fn(),
  updateUserMission: vi.fn(),
  getUser: vi.fn(),
  updateUserPoints: vi.fn(),
  createSubmission: vi.fn(),
};

/**
 * Replicated business logic from POST /api/tasks/complete (server/routes.ts).
 * This is the function under test.
 */
async function completeTask(
  storage: typeof mockStorage,
  params: {
    userId: string;
    missionId: number;
    taskId: string;
    taskType: string;
    answer?: string;
    proofUrl?: string;
  }
) {
  const { userId, missionId, taskId, taskType, answer, proofUrl } = params;

  if (!userId || !missionId || !taskId || !taskType) {
    return { status: 400, body: { error: "Missing required fields" } };
  }

  const mission: Mission | undefined = await storage.getMission(missionId);
  if (!mission) {
    return { status: 404, body: { error: "Mission not found" } };
  }

  const task = mission.tasks.find((t) => t.id === taskId);
  if (!task) {
    return { status: 404, body: { error: "Task not found" } };
  }

  let userMission: UserMission | undefined = await storage.getUserMission(userId, missionId);
  if (!userMission) {
    userMission = await storage.createUserMission({
      userId,
      missionId,
      status: "in_progress",
      completedTasks: [],
    });
  }

  if (userMission!.completedTasks.includes(taskId)) {
    return { status: 400, body: { error: "Task already completed" } };
  }

  const autoValidatedTypes = ["gps", "quiz", "qrcode"];
  const manualReviewTypes = ["photo", "receipt"];

  if (autoValidatedTypes.includes(taskType)) {
    if (taskType === "quiz") {
      const correctAnswer = task.correctAnswer;
      const userAnswer = parseInt(answer ?? "");
      if (correctAnswer !== userAnswer) {
        return { status: 400, body: { error: "Incorrect answer", valid: false } };
      }
    }

    const completedTasks = [...userMission!.completedTasks, taskId];
    await storage.updateUserMission(userMission!.id, { completedTasks });

    const user = await storage.getUser(userId);
    if (user) {
      await storage.updateUserPoints(userId, user.points + task.points);
    }

    if (completedTasks.length === mission.tasks.length) {
      await storage.updateUserMission(userMission!.id, {
        status: "completed",
        completedAt: expect.any(Date),
      });
    }

    return {
      status: 200,
      body: { success: true, pointsAwarded: task.points, autoValidated: true, completedTasks },
    };
  } else if (manualReviewTypes.includes(taskType)) {
    const submission = await storage.createSubmission({
      userId,
      missionId,
      taskId,
      type: taskType,
      proofUrl: proofUrl || null,
      status: "pending",
    });

    return {
      status: 200,
      body: { success: true, pendingReview: true, submissionId: submission.id, message: "Your submission is pending review" },
    };
  }

  return { status: 400, body: { error: "Unknown task type" } };
}

// ---------------------------------------------------------------------------
// TEST DATA (Stubs)
// ---------------------------------------------------------------------------
const stubMission: Mission = {
  id: 1,
  title: "Marina Bay Discovery",
  tasks: [
    { id: "1", type: "gps", title: "Check-in at Marina Bay Sands", description: "Visit the iconic Marina Bay Sands", points: 100 },
    { id: "2", type: "photo", title: "Capture the Merlion", description: "Take a photo with the Merlion statue", points: 100 },
    { id: "3", type: "quiz", title: "Singapore Trivia", description: "Answer a question about Singapore", points: 100, correctAnswer: 0 },
  ],
};

const stubUserMission: UserMission = {
  id: 10,
  userId: "user-abc",
  missionId: 1,
  status: "in_progress",
  completedTasks: [],
};

const stubUser = { id: "user-abc", points: 200 };

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------
describe("Task Completion Logic", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default stubs – individual tests override as needed
    mockStorage.getMission.mockResolvedValue(stubMission);
    mockStorage.getUserMission.mockResolvedValue({ ...stubUserMission, completedTasks: [] });
    mockStorage.getUser.mockResolvedValue({ ...stubUser });
    mockStorage.updateUserMission.mockResolvedValue(undefined);
    mockStorage.updateUserPoints.mockResolvedValue(undefined);
  });

  // =====================================================
  // TEST 1 – Happy Path: GPS check-in auto-validates
  // =====================================================
  it("should auto-validate a GPS check-in and award points", async () => {
    // Arrange
    const params = { userId: "user-abc", missionId: 1, taskId: "1", taskType: "gps" };
    const updateSpy = vi.spyOn(mockStorage, "updateUserMission");

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({ success: true, pointsAwarded: 100, autoValidated: true })
    );
    expect(updateSpy).toHaveBeenCalledWith(10, { completedTasks: ["1"] });
    expect(mockStorage.updateUserPoints).toHaveBeenCalledWith("user-abc", 300);
  });

  // =====================================================
  // TEST 2 – Quiz with correct answer
  // =====================================================
  it("should accept a correct quiz answer and award points", async () => {
    // Arrange
    const params = { userId: "user-abc", missionId: 1, taskId: "3", taskType: "quiz", answer: "0" };

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({ success: true, pointsAwarded: 100, autoValidated: true })
    );
  });

  // =====================================================
  // TEST 3 – Quiz with wrong answer (Edge Case)
  // =====================================================
  it("should reject an incorrect quiz answer", async () => {
    // Arrange
    const params = { userId: "user-abc", missionId: 1, taskId: "3", taskType: "quiz", answer: "2" };

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "Incorrect answer", valid: false });
    expect(mockStorage.updateUserMission).not.toHaveBeenCalled();
  });

  // =====================================================
  // TEST 4 – Duplicate task submission (Edge Case)
  // =====================================================
  it("should reject a task that was already completed", async () => {
    // Arrange – stub userMission with task "1" already done
    mockStorage.getUserMission.mockResolvedValue({
      ...stubUserMission,
      completedTasks: ["1"],
    });
    const params = { userId: "user-abc", missionId: 1, taskId: "1", taskType: "gps" };

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "Task already completed" });
  });

  // =====================================================
  // TEST 5 – Photo upload triggers manual review
  // =====================================================
  it("should create a pending submission for photo tasks", async () => {
    // Arrange
    mockStorage.createSubmission.mockResolvedValue({ id: 55 });
    const params = { userId: "user-abc", missionId: 1, taskId: "2", taskType: "photo", proofUrl: "https://example.com/photo.jpg" };

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({ success: true, pendingReview: true, submissionId: 55 })
    );
    expect(mockStorage.createSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-abc", type: "photo", status: "pending" })
    );
  });

  // =====================================================
  // TEST 6 – Mission not found (Edge Case)
  // =====================================================
  it("should return 404 when mission does not exist", async () => {
    // Arrange
    mockStorage.getMission.mockResolvedValue(undefined);
    const params = { userId: "user-abc", missionId: 999, taskId: "1", taskType: "gps" };

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: "Mission not found" });
  });

  // =====================================================
  // TEST 7 – Missing required fields (Edge Case)
  // =====================================================
  it("should return 400 when required fields are missing", async () => {
    // Arrange
    const params = { userId: "", missionId: 1, taskId: "1", taskType: "gps" };

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "Missing required fields" });
  });

  // =====================================================
  // TEST 8 – Completing final task marks mission complete (Spy)
  // =====================================================
  it("should mark the mission as completed when all tasks are done", async () => {
    // Arrange – 2 of 3 tasks already completed
    mockStorage.getUserMission.mockResolvedValue({
      ...stubUserMission,
      completedTasks: ["1", "2"],
    });
    const updateSpy = vi.spyOn(mockStorage, "updateUserMission");
    const params = { userId: "user-abc", missionId: 1, taskId: "3", taskType: "quiz", answer: "0" };

    // Act
    const result = await completeTask(mockStorage, params);

    // Assert
    expect(result.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(10, { completedTasks: ["1", "2", "3"] });
    expect(updateSpy).toHaveBeenCalledWith(10, expect.objectContaining({ status: "completed" }));
  });
});
