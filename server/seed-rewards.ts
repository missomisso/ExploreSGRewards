import { sbStorage } from "./storage";

const sampleRewards = [
  {
    title: "1-for-1 Bubble Tea",
    description: "Get a free bubble tea when you buy one at any LiHO outlet.",
    merchant: "LiHO Tea",
    cost: 500,
    icon: "Coffee",
    expiryDays: 30,
  },
  {
    title: "$10 Off Entry Ticket",
    description: "Get $10 off your entry ticket to Gardens by the Bay.",
    merchant: "Gardens by the Bay",
    cost: 1000,
    icon: "Ticket",
    expiryDays: 60,
  },
  {
    title: "Exclusive Merlion Plushie",
    description: "Claim your exclusive Merlion plushie at any ExploreSG Shop.",
    merchant: "ExploreSG Shop",
    cost: 2500,
    icon: "Gift",
    expiryDays: 90,
  },
  {
    title: "20% Off Souvenirs",
    description: "Get 20% off all souvenirs at Chinatown Heritage Shop.",
    merchant: "Chinatown Heritage Shop",
    cost: 800,
    icon: "ShoppingBag",
    expiryDays: 30,
  },
  {
    title: "Free Museum Entry",
    description: "Free entry to Singapore National Museum.",
    merchant: "National Museum",
    cost: 1500,
    icon: "Ticket",
    expiryDays: 45,
  },
];

async function main() {
  console.log("Seeding rewards...");
  
  for (const reward of sampleRewards) {
    try {
      await sbStorage.createReward(reward);
      console.log(`Added reward: ${reward.title}`);
    } catch (error) {
      console.log(`Reward might already exist: ${reward.title}`);
    }
  }
  
  console.log("\nRewards seeded successfully!");
  process.exit(0);
}

main();
