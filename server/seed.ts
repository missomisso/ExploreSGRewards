import { storage } from "./storage";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create tourist users
  const tourists = [
    {
      name: "Alex Chen",
      email: "alex@example.com",
      password: "demo123",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      role: "tourist",
      level: 3,
      points: 1250,
    },
    {
      name: "Sarah Miller",
      email: "sarah@example.com",
      password: "demo123",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      role: "tourist",
      level: 5,
      points: 2800,
    },
    {
      name: "James Wong",
      email: "james@example.com",
      password: "demo123",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
      role: "tourist",
      level: 2,
      points: 650,
    },
    {
      name: "Emma Davis",
      email: "emma@example.com",
      password: "demo123",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      role: "tourist",
      level: 4,
      points: 1900,
    },
    {
      name: "Michael Tan",
      email: "michael@example.com",
      password: "demo123",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      role: "tourist",
      level: 1,
      points: 200,
    },
  ];

  // Create business users
  const businesses = [
    {
      name: "Marina Bay Cafe",
      email: "marina@business.com",
      password: "business123",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=MarinaBay",
      role: "business",
      businessName: "Marina Bay Cafe",
      businessDescription: "Premium cafe with stunning views of Marina Bay Sands",
      level: 1,
      points: 0,
    },
    {
      name: "Gardens Gift Shop",
      email: "gardens@business.com",
      password: "business123",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Gardens",
      role: "business",
      businessName: "Gardens Gift Shop",
      businessDescription: "Official souvenir shop at Gardens by the Bay",
      level: 1,
      points: 0,
    },
    {
      name: "Chinatown Heritage",
      email: "chinatown@business.com",
      password: "business123",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Chinatown",
      role: "business",
      businessName: "Chinatown Heritage Tours",
      businessDescription: "Authentic cultural walking tours in Chinatown",
      level: 1,
      points: 0,
    },
  ];

  // Create admin user
  const admin = {
    name: "Platform Admin",
    email: "admin@exploresg.com",
    password: "admin123",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    role: "admin",
    level: 1,
    points: 0,
  };

  // Seed all users
  for (const tourist of tourists) {
    try {
      const user = await storage.createUser(tourist);
      console.log("✅ Created tourist:", user.email);
    } catch (e: any) {
      if (e.code === '23505') {
        console.log("⏭️ Tourist already exists:", tourist.email);
      } else {
        throw e;
      }
    }
  }

  for (const business of businesses) {
    try {
      const user = await storage.createUser(business);
      console.log("✅ Created business:", user.email);
    } catch (e: any) {
      if (e.code === '23505') {
        console.log("⏭️ Business already exists:", business.email);
      } else {
        throw e;
      }
    }
  }

  try {
    const adminUser = await storage.createUser(admin);
    console.log("✅ Created admin:", adminUser.email);
  } catch (e: any) {
    if (e.code === '23505') {
      console.log("⏭️ Admin already exists:", admin.email);
    } else {
      throw e;
    }
  }

  // Create sample missions
  const missions = [
    {
      businessId: null,
      title: "Discover Merlion Park",
      description: "Visit Singapore's iconic Merlion and complete all challenges!",
      location: "Merlion Park, Marina Bay",
      totalPoints: 500,
      category: "Landmarks",
      imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
      status: "active" as const,
      startDate: new Date(),
      endDate: null,
      tasks: [
        {
          id: "task1",
          type: "gps" as const,
          title: "Check-in at Merlion",
          description: "Visit the Merlion statue and check in",
          points: 100,
        },
        {
          id: "task2",
          type: "photo" as const,
          title: "Selfie with Merlion",
          description: "Take a photo with the Merlion in the background",
          points: 150,
        },
        {
          id: "task3",
          type: "quiz" as const,
          title: "Merlion Trivia",
          description: "Test your knowledge about the Merlion",
          points: 100,
          question: "When was the Merlion statue officially unveiled?",
          options: ["1964", "1972", "1980", "1990"],
          correctAnswer: 1,
        },
        {
          id: "task4",
          type: "receipt" as const,
          title: "Support Local Business",
          description: "Make a purchase at a nearby café and upload receipt",
          points: 150,
        },
      ],
    },
    {
      businessId: null,
      title: "Gardens by the Bay Explorer",
      description: "Explore the stunning Gardens by the Bay and earn rewards!",
      location: "Gardens by the Bay",
      totalPoints: 600,
      category: "Nature",
      imageUrl: "https://images.unsplash.com/photo-1552663651-4e69038badb4?w=800",
      status: "active" as const,
      startDate: new Date(),
      endDate: null,
      tasks: [
        {
          id: "task1",
          type: "gps" as const,
          title: "Visit Supertree Grove",
          description: "Check in at the iconic Supertree Grove",
          points: 150,
        },
        {
          id: "task2",
          type: "photo" as const,
          title: "Capture the Supertrees",
          description: "Take a stunning photo of the Supertrees",
          points: 200,
        },
        {
          id: "task3",
          type: "qrcode" as const,
          title: "Scan QR Code",
          description: "Find and scan the QR code at the Garden entrance",
          points: 100,
        },
        {
          id: "task4",
          type: "quiz" as const,
          title: "Garden Knowledge",
          description: "Answer a question about the Gardens",
          points: 150,
          question: "How many Supertrees are there in the Supertree Grove?",
          options: ["9", "12", "18", "25"],
          correctAnswer: 2,
        },
      ],
    },
    {
      businessId: null,
      title: "Chinatown Heritage Tour",
      description: "Immerse yourself in the rich culture and history of Chinatown",
      location: "Chinatown",
      totalPoints: 400,
      category: "Culture",
      imageUrl: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800",
      status: "active" as const,
      startDate: new Date(),
      endDate: null,
      tasks: [
        {
          id: "task1",
          type: "gps" as const,
          title: "Buddha Tooth Relic Temple",
          description: "Check in at the Buddha Tooth Relic Temple",
          points: 100,
        },
        {
          id: "task2",
          type: "photo" as const,
          title: "Street Photography",
          description: "Capture the vibrant street life of Chinatown",
          points: 150,
        },
        {
          id: "task3",
          type: "receipt" as const,
          title: "Local Delights",
          description: "Try local food and upload your receipt",
          points: 150,
        },
      ],
    },
  ];

  for (const missionData of missions) {
    try {
      const mission = await storage.createMission(missionData);
      console.log("✅ Created mission:", mission.title);
    } catch (e: any) {
      if (e.code === '23505') {
        console.log("⏭️ Mission already exists:", missionData.title);
      } else {
        throw e;
      }
    }
  }

  // Create sample rewards
  const rewardsData = [
    {
      title: "$5 Food Voucher",
      description: "Redeemable at participating restaurants",
      cost: 500,
      merchant: "FoodHub SG",
      icon: "utensils",
      category: "Food & Beverage",
    },
    {
      title: "Free Coffee",
      description: "One free coffee at Starbucks",
      cost: 300,
      merchant: "Starbucks",
      icon: "coffee",
      category: "Food & Beverage",
    },
    {
      title: "10% Off Shopping",
      description: "Get 10% off your next purchase at ION Orchard",
      cost: 400,
      merchant: "ION Orchard",
      icon: "shopping-bag",
      category: "Shopping",
    },
    {
      title: "Museum Entry",
      description: "Free entry to National Museum of Singapore",
      cost: 600,
      merchant: "National Museum",
      icon: "landmark",
      category: "Attractions",
    },
  ];

  for (const rewardData of rewardsData) {
    try {
      const reward = await storage.createReward(rewardData);
      console.log("✅ Created reward:", reward.title);
    } catch (e: any) {
      if (e.code === '23505') {
        console.log("⏭️ Reward already exists:", rewardData.title);
      } else {
        throw e;
      }
    }
  }

  console.log("🎉 Seeding complete!");
}

seed().catch(console.error);
