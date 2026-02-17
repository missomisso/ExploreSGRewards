export interface User {
  id: string;
  points: number;
  [key: string]: any;
}

export interface Reward {
  id: number;
  cost: number;
  quantityLimit: number | null;
  expiryDays: number | null;
  [key: string]: any;
}

export interface ClaimResult {
  success: boolean;
  error?: string;
  code?: string;
  newPoints?: number;
  expiresAt?: Date;
}

export interface StorageDeps {
  getUser: (id: string) => Promise<User | undefined>;
  getReward: (id: number) => Promise<Reward | undefined>;
  getClaimedCount: (rewardId: number) => Promise<number>;
  updateUserPoints: (id: string, points: number) => Promise<void>;
  createUserReward: (data: any) => Promise<any>;
}

export function generateRewardCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function calculateExpiryDate(days: number): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export function canUserAfford(userPoints: number, rewardCost: number): boolean {
  return userPoints >= rewardCost;
}

export function isRewardSoldOut(claimedCount: number, quantityLimit: number | null): boolean {
  if (!quantityLimit) return false;
  return claimedCount >= quantityLimit;
}

export async function claimReward(
  userId: string,
  rewardId: number,
  storage: StorageDeps
): Promise<ClaimResult> {
  const user = await storage.getUser(userId);
  const reward = await storage.getReward(rewardId);

  if (!user || !reward) {
    return { success: false, error: "User or reward not found" };
  }

  if (!canUserAfford(user.points, reward.cost)) {
    return { success: false, error: "Insufficient points" };
  }

  if (reward.quantityLimit) {
    const claimedCount = await storage.getClaimedCount(rewardId);
    if (isRewardSoldOut(claimedCount, reward.quantityLimit)) {
      return { success: false, error: "This reward is sold out" };
    }
  }

  const newPoints = user.points - reward.cost;
  await storage.updateUserPoints(userId, newPoints);

  const code = generateRewardCode();
  const expiresAt = calculateExpiryDate(reward.expiryDays || 30);

  await storage.createUserReward({
    userId,
    rewardId,
    code,
    used: false,
    expiresAt,
  });

  return { success: true, code, newPoints, expiresAt };
}
