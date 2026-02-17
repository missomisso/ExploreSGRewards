import { describe, it, expect } from "vitest";
import { filterRewards } from "../../src/features/rewards/rewardsLogic";

describe("filterRewards", () => {
  it("returns all rewards when query is empty", () => {
    const stubRewards = [{ id: "1", title: "Free Coffee" }, { id: "2", title: "Museum Pass" }];
    expect(filterRewards(stubRewards, "")).toHaveLength(2);
  });

  it("filters by title (case-insensitive)", () => {
    const stubRewards = [{ id: "1", title: "Free Coffee" }, { id: "2", title: "Museum Pass" }];
    expect(filterRewards(stubRewards, "coffee")).toEqual([{ id: "1", title: "Free Coffee" }]);
  });

  it("returns empty when nothing matches", () => {
    const stubRewards = [{ id: "1", title: "Free Coffee" }];
    expect(filterRewards(stubRewards, "zzz")).toEqual([]);
  });
});
