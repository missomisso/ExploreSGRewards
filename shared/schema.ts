import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, timestamp, boolean, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  role: text("role").default("tourist").notNull(), // tourist, business, admin
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  level: integer("level").default(1).notNull(),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Missions Table
export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  totalPoints: integer("total_points").notNull(),
  category: text("category"),
  imageUrl: text("image_url"),
  status: text("status").default("active").notNull(), // active, draft, ended
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  tasks: json("tasks").$type<TaskDefinition[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskDefinition = {
  id: string;
  type: "gps" | "photo" | "receipt" | "quiz" | "qrcode";
  title: string;
  description: string;
  points: number;
  question?: string;
  options?: string[];
  correctAnswer?: number;
};

export const insertMissionSchema = createInsertSchema(missions).omit({ id: true, createdAt: true });
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

// User Mission Progress
export const userMissions = pgTable("user_missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  missionId: integer("mission_id").notNull().references(() => missions.id),
  status: text("status").default("in_progress").notNull(), // in_progress, completed
  completedTasks: json("completed_tasks").$type<string[]>().default([]).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertUserMissionSchema = createInsertSchema(userMissions).omit({ id: true, startedAt: true });
export type InsertUserMission = z.infer<typeof insertUserMissionSchema>;
export type UserMission = typeof userMissions.$inferSelect;

// Task Submissions (for verification)
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  missionId: integer("mission_id").notNull().references(() => missions.id),
  taskId: text("task_id").notNull(),
  type: text("type").notNull(), // photo, receipt, quiz
  proofUrl: text("proof_url"),
  answer: text("answer"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  reviewNote: text("review_note"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// Rewards
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  cost: integer("cost").notNull(),
  merchant: text("merchant"),
  icon: text("icon"),
  category: text("category"),
  expiryDays: integer("expiry_days").default(30),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true, createdAt: true });
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

// User Rewards (claimed)
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  code: text("code").notNull(),
  used: boolean("used").default(false).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertUserRewardSchema = createInsertSchema(userRewards).omit({ id: true, claimedAt: true });
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
export type UserReward = typeof userRewards.$inferSelect;
