import { supabaseAdmin } from "./supabase";
import { db } from "./db";
import { users } from "@shared/schema";

const businessAccounts = [
  {
    email: "marina.hotel@business.sg",
    firstName: "Marina",
    lastName: "Bay Hotel",
    businessName: "Marina Bay Sands",
    businessDescription: "Luxury integrated resort featuring hotel, casino, shopping, and entertainment."
  },
  {
    email: "jewel@business.sg", 
    firstName: "Jewel",
    lastName: "Changi",
    businessName: "Jewel Changi Airport",
    businessDescription: "Nature-themed entertainment complex with the world's tallest indoor waterfall."
  },
  {
    email: "gardens@business.sg",
    firstName: "Gardens",
    lastName: "Manager",
    businessName: "Gardens by the Bay",
    businessDescription: "Award-winning horticultural destination with iconic Supertree structures."
  },
  {
    email: "sentosa@business.sg",
    firstName: "Sentosa",
    lastName: "Resort",
    businessName: "Sentosa Development Corporation",
    businessDescription: "Premier island resort destination with beaches, attractions, and hotels."
  },
  {
    email: "hawker@business.sg",
    firstName: "Maxwell",
    lastName: "Food Centre",
    businessName: "Maxwell Food Centre",
    businessDescription: "Historic hawker centre famous for Tian Tian Hainanese Chicken Rice."
  },
  {
    email: "zoo@business.sg",
    firstName: "Singapore",
    lastName: "Zoo",
    businessName: "Singapore Zoo",
    businessDescription: "Award-winning zoo with open-concept exhibits and over 2,800 animals."
  },
  {
    email: "artscience@business.sg",
    firstName: "ArtScience",
    lastName: "Museum",
    businessName: "ArtScience Museum",
    businessDescription: "Iconic museum exploring the intersection of art, science, and technology."
  },
  {
    email: "clarke@business.sg",
    firstName: "Clarke",
    lastName: "Quay",
    businessName: "Clarke Quay",
    businessDescription: "Riverside dining and entertainment hub with restaurants and nightlife."
  }
];

async function createBusinessUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  businessName: string,
  businessDescription: string
) {
  console.log(`Creating business account: ${email} (${businessName})...`);

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log(`User ${email} already exists, updating database record...`);
      const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.find(u => u.email === email);
      if (existingUser) {
        await db.insert(users).values({
          id: existingUser.id,
          email,
          firstName,
          lastName,
          role: "business",
          businessName,
          businessDescription,
          level: 1,
          points: 0,
        }).onConflictDoUpdate({
          target: users.id,
          set: { role: "business", firstName, lastName, businessName, businessDescription },
        });
        console.log(`Updated ${email}`);
        return existingUser.id;
      }
    }
    throw authError;
  }

  if (authUser.user) {
    await db.insert(users).values({
      id: authUser.user.id,
      email,
      firstName,
      lastName,
      role: "business",
      businessName,
      businessDescription,
      level: 1,
      points: 0,
    }).onConflictDoUpdate({
      target: users.id,
      set: { role: "business", firstName, lastName, businessName, businessDescription },
    });
    console.log(`Created ${email}`);
    return authUser.user.id;
  }
}

async function main() {
  try {
    console.log("Seeding business accounts...\n");

    for (const business of businessAccounts) {
      await createBusinessUser(
        business.email,
        "abc123456",
        business.firstName,
        business.lastName,
        business.businessName,
        business.businessDescription
      );
    }

    console.log("\n========================================");
    console.log("Business accounts created successfully!");
    console.log("========================================");
    console.log("\nAll accounts use password: abc123456\n");
    businessAccounts.forEach(b => {
      console.log(`  - ${b.businessName}: ${b.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating business accounts:", error);
    process.exit(1);
  }
}

main();
