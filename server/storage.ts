import {
  users,
  missions,
  userMissions,
  submissions,
  rewards,
  userRewards,
  type User,
  type UpsertUser,
  type Mission,
  type InsertMission,
  type UserMission,
  type InsertUserMission,
  type Submission,
  type InsertSubmission,
  type Reward,
  type InsertReward,
  type UserReward,
  type InsertUserReward,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  updateUserPoints(id: string, points: number): Promise<void>;

  // Missions
  getMissions(activeOnly?: boolean): Promise<Mission[]>;
  getMission(id: number): Promise<Mission | undefined>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: number, mission: Partial<InsertMission>): Promise<Mission | undefined>;
  deleteMission(id: number): Promise<void>;

  // User Missions
  getUserMission(userId: string, missionId: number): Promise<UserMission | undefined>;
  createUserMission(userMission: InsertUserMission): Promise<UserMission>;
  updateUserMission(id: number, userMission: Partial<InsertUserMission>): Promise<UserMission | undefined>;
  getUserMissions(userId: string): Promise<UserMission[]>;

  // Submissions
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissions(missionId?: number, status?: string): Promise<Submission[]>;
  updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission | undefined>;

  // Rewards
  getRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  deleteReward(id: number): Promise<void>;

  // User Rewards
  createUserReward(userReward: InsertUserReward): Promise<UserReward>;
  getUserRewards(userId: string): Promise<UserReward[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: UpsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async updateUserPoints(id: string, points: number): Promise<void> {
    await db.update(users).set({ points }).where(eq(users.id, id));
  }

  // Missions
  async getMissions(activeOnly: boolean = true): Promise<Mission[]> {
    if (activeOnly) {
      return await db.select().from(missions).where(eq(missions.status, "active")).orderBy(desc(missions.createdAt));
    }
    return await db.select().from(missions).orderBy(desc(missions.createdAt));
  }

  async getMission(id: number): Promise<Mission | undefined> {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission || undefined;
  }

  async createMission(mission: InsertMission): Promise<Mission> {
    const [newMission] = await db.insert(missions).values(mission as any).returning();
    return newMission;
  }

  async updateMission(id: number, mission: Partial<InsertMission>): Promise<Mission | undefined> {
    const [updated] = await db.update(missions).set(mission as any).where(eq(missions.id, id)).returning();
    return updated || undefined;
  }

  async deleteMission(id: number): Promise<void> {
    await db.delete(missions).where(eq(missions.id, id));
  }

  // User Missions
  async getUserMission(userId: string, missionId: number): Promise<UserMission | undefined> {
    const [userMission] = await db
      .select()
      .from(userMissions)
      .where(and(eq(userMissions.userId, userId), eq(userMissions.missionId, missionId)));
    return userMission || undefined;
  }

  async createUserMission(userMission: InsertUserMission): Promise<UserMission> {
    const [newUserMission] = await db.insert(userMissions).values(userMission as any).returning();
    return newUserMission;
  }

  async updateUserMission(id: number, userMission: Partial<InsertUserMission>): Promise<UserMission | undefined> {
    const [updated] = await db.update(userMissions).set(userMission as any).where(eq(userMissions.id, id)).returning();
    return updated || undefined;
  }

  async getUserMissions(userId: string): Promise<UserMission[]> {
    return await db.select().from(userMissions).where(eq(userMissions.userId, userId));
  }

  // Submissions
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async getSubmissions(missionId?: number, status?: string): Promise<Submission[]> {
    if (missionId && status) {
      return await db.select().from(submissions)
        .where(and(eq(submissions.missionId, missionId), eq(submissions.status, status)))
        .orderBy(desc(submissions.submittedAt));
    } else if (missionId) {
      return await db.select().from(submissions)
        .where(eq(submissions.missionId, missionId))
        .orderBy(desc(submissions.submittedAt));
    } else if (status) {
      return await db.select().from(submissions)
        .where(eq(submissions.status, status))
        .orderBy(desc(submissions.submittedAt));
    }
    
    return await db.select().from(submissions).orderBy(desc(submissions.submittedAt));
  }

  async updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission | undefined> {
    const [updated] = await db.update(submissions).set(submission).where(eq(submissions.id, id)).returning();
    return updated || undefined;
  }

  // Rewards
  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).orderBy(desc(rewards.createdAt));
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward || undefined;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async deleteReward(id: number): Promise<void> {
    await db.delete(rewards).where(eq(rewards.id, id));
  }

  // User Rewards
  async createUserReward(userReward: InsertUserReward): Promise<UserReward> {
    const [newUserReward] = await db.insert(userRewards).values(userReward).returning();
    return newUserReward;
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    return await db.select().from(userRewards).where(eq(userRewards.userId, userId)).orderBy(desc(userRewards.claimedAt));
  }
}

export const storage = new DatabaseStorage();
