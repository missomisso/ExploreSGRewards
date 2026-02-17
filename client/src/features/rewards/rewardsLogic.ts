export type Reward = { id: string; title: string; category?: string };

export function filterRewards(rewards: Reward[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return rewards;
  return rewards.filter(r =>
    (r.title || "").toLowerCase().includes(q) ||
    (r.category || "").toLowerCase().includes(q)
  );
}
