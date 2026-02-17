import { describe, it, expect, vi, beforeEach } from "vitest";
import { filterRewards } from "../../client/src/features/rewards/rewardsLogic";
import {
  canUserAfford,
  isRewardSoldOut,
  generateRewardCode,
  calculateExpiryDate,
  claimReward,
  type StorageDeps,
} from "../../server/rewardsClaim";

describe("filterRewards – Unit Tests", () => {
  // Arrange: stub data used across tests
  const stubRewards = [
    { id: "1", title: "Free Coffee", category: "Food" },
    { id: "2", title: "Museum Pass", category: "Culture" },
    { id: "3", title: "Spa Voucher", category: "Wellness" },
  ];

  it("returns all rewards when query is empty (Happy Path)", () => {
    // Arrange
    const query = "";
    // Act
    const result = filterRewards(stubRewards, query);
    // Assert
    expect(result).toHaveLength(3);
  });

  it("filters rewards by title – case insensitive", () => {
    // Arrange
    const query = "coffee";
    // Act
    const result = filterRewards(stubRewards, query);
    // Assert
    expect(result).toEqual([{ id: "1", title: "Free Coffee", category: "Food" }]);
  });

  it("filters rewards by category", () => {
    // Arrange
    const query = "Culture";
    // Act
    const result = filterRewards(stubRewards, query);
    // Assert
    expect(result).toEqual([{ id: "2", title: "Museum Pass", category: "Culture" }]);
  });

  it("returns empty array when nothing matches", () => {
    // Arrange
    const query = "nonexistent";
    // Act
    const result = filterRewards(stubRewards, query);
    // Assert
    expect(result).toEqual([]);
  });

  it("handles whitespace-only query as empty", () => {
    // Arrange
    const query = "   ";
    // Act
    const result = filterRewards(stubRewards, query);
    // Assert
    expect(result).toHaveLength(3);
  });
});

describe("canUserAfford – Pure Logic", () => {
  it("returns true when user has enough points", () => {
    // Arrange
    const userPoints = 500;
    const rewardCost = 300;
    // Act
    const result = canUserAfford(userPoints, rewardCost);
    // Assert
    expect(result).toBe(true);
  });

  it("returns true when points equal cost exactly", () => {
    // Arrange & Act & Assert
    expect(canUserAfford(100, 100)).toBe(true);
  });

  it("returns false when user has insufficient points", () => {
    // Arrange & Act & Assert
    expect(canUserAfford(50, 100)).toBe(false);
  });
});

describe("isRewardSoldOut – Pure Logic", () => {
  it("returns false when no quantity limit is set", () => {
    expect(isRewardSoldOut(99, null)).toBe(false);
  });

  it("returns true when claimed count meets the limit", () => {
    expect(isRewardSoldOut(10, 10)).toBe(true);
  });

  it("returns false when claimed count is below limit", () => {
    expect(isRewardSoldOut(3, 10)).toBe(false);
  });
});

describe("generateRewardCode", () => {
  it("returns an uppercase alphanumeric string", () => {
    const code = generateRewardCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("returns a string of at least 6 characters", () => {
    const code = generateRewardCode();
    expect(code.length).toBeGreaterThanOrEqual(6);
  });
});

describe("calculateExpiryDate", () => {
  it("returns a date N days in the future", () => {
    const days = 30;
    const before = new Date();
    const result = calculateExpiryDate(days);
    const expected = new Date();
    expected.setDate(expected.getDate() + days);
    expect(result.getDate()).toBe(expected.getDate());
    expect(result.getMonth()).toBe(expected.getMonth());
  });
});

describe("claimReward – with Mocks, Spies, and Stubs (AAA Pattern)", () => {
  let mockStorage: StorageDeps;

  const stubUser = { id: "user-1", points: 500, email: "test@test.com" };
  const stubReward = {
    id: 1,
    cost: 200,
    quantityLimit: 10,
    expiryDays: 30,
    title: "Free Coffee",
  };

  beforeEach(() => {
    // Arrange: create a full mock of the storage dependency
    mockStorage = {
      getUser: vi.fn(),
      getReward: vi.fn(),
      getClaimedCount: vi.fn(),
      updateUserPoints: vi.fn(),
      createUserReward: vi.fn(),
    };
  });

  it("successfully claims a reward (Happy Path) – uses Mock + Spy", async () => {
    // Arrange: stub return values
    (mockStorage.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(stubUser);
    (mockStorage.getReward as ReturnType<typeof vi.fn>).mockResolvedValue(stubReward);
    (mockStorage.getClaimedCount as ReturnType<typeof vi.fn>).mockResolvedValue(3);
    (mockStorage.updateUserPoints as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockStorage.createUserReward as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });

    // Act
    const result = await claimReward("user-1", 1, mockStorage);

    // Assert
    expect(result.success).toBe(true);
    expect(result.newPoints).toBe(300);
    expect(result.code).toBeDefined();
    // Spy: verify updateUserPoints was called with correct deducted points
    expect(mockStorage.updateUserPoints).toHaveBeenCalledWith("user-1", 300);
    // Spy: verify createUserReward was called once
    expect(mockStorage.createUserReward).toHaveBeenCalledTimes(1);
  });

  it("returns error when user is not found – uses Mock", async () => {
    // Arrange: stub user as undefined (not found)
    (mockStorage.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockStorage.getReward as ReturnType<typeof vi.fn>).mockResolvedValue(stubReward);

    // Act
    const result = await claimReward("unknown-user", 1, mockStorage);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe("User or reward not found");
    // Spy: verify points were never updated
    expect(mockStorage.updateUserPoints).not.toHaveBeenCalled();
  });

  it("returns error when user has insufficient points – uses Stub", async () => {
    // Arrange: stub user with low points
    const poorUser = { ...stubUser, points: 50 };
    (mockStorage.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(poorUser);
    (mockStorage.getReward as ReturnType<typeof vi.fn>).mockResolvedValue(stubReward);

    // Act
    const result = await claimReward("user-1", 1, mockStorage);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe("Insufficient points");
    expect(mockStorage.updateUserPoints).not.toHaveBeenCalled();
  });

  it("returns error when reward is sold out – uses Mock + Stub", async () => {
    // Arrange: stub claimed count at limit
    (mockStorage.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(stubUser);
    (mockStorage.getReward as ReturnType<typeof vi.fn>).mockResolvedValue(stubReward);
    (mockStorage.getClaimedCount as ReturnType<typeof vi.fn>).mockResolvedValue(10);

    // Act
    const result = await claimReward("user-1", 1, mockStorage);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe("This reward is sold out");
    expect(mockStorage.getClaimedCount).toHaveBeenCalledWith(1);
  });

  it("skips quantity check when no limit is set", async () => {
    // Arrange: stub reward with no quantity limit
    const unlimitedReward = { ...stubReward, quantityLimit: null };
    (mockStorage.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(stubUser);
    (mockStorage.getReward as ReturnType<typeof vi.fn>).mockResolvedValue(unlimitedReward);
    (mockStorage.updateUserPoints as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockStorage.createUserReward as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 100 });

    // Act
    const result = await claimReward("user-1", 1, mockStorage);

    // Assert
    expect(result.success).toBe(true);
    // Spy: getClaimedCount should NOT have been called
    expect(mockStorage.getClaimedCount).not.toHaveBeenCalled();
  });

  it("uses default 30-day expiry when expiryDays is null", async () => {
    // Arrange
    const noExpiryReward = { ...stubReward, expiryDays: null };
    (mockStorage.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(stubUser);
    (mockStorage.getReward as ReturnType<typeof vi.fn>).mockResolvedValue(noExpiryReward);
    (mockStorage.getClaimedCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (mockStorage.updateUserPoints as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockStorage.createUserReward as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 101 });

    // Act
    const result = await claimReward("user-1", 1, mockStorage);

    // Assert
    expect(result.success).toBe(true);
    expect(result.expiresAt).toBeDefined();
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 30);
    expect(result.expiresAt!.getDate()).toBe(expectedDate.getDate());
  });
});
