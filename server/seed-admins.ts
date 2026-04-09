import { supabaseAdmin } from "./supabase";
import { sbStorage } from "./storage";

async function createAdminUser(email: string, password: string, role: "admin" | "business", firstName: string, lastName: string) {
  console.log(`Creating ${role} account: ${email}...`);
  
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log(`User ${email} already exists in Supabase Auth, fetching...`);
      const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.find(u => u.email === email);
      if (existingUser) {
        let user = await sbStorage.getUser(existingUser.id);
        if (user) {
          await sbStorage.updateUser(existingUser.id, {
            email,
            firstName,
            lastName,
            role,
          });
        } else {
          await sbStorage.createUser({
            id: existingUser.id,
            email,
            firstName,
            lastName,
            role,
            level: 1,
            points: 0,
          });
        }
        console.log(`Updated ${email} with role: ${role}`);
        return;
      }
    }
    throw authError;
  }

  if (authUser.user) {
    let user = await sbStorage.getUser(authUser.user.id);
    if (user) {
      await sbStorage.updateUser(authUser.user.id, {
        email,
        firstName,
        lastName,
        role,
      });
    } else {
      await sbStorage.createUser({
        id: authUser.user.id,
        email,
        firstName,
        lastName,
        role,
        level: 1,
        points: 0,
      });
    }
    console.log(`Created ${email} with role: ${role}`);
  }
}

async function main() {
  try {
    await createAdminUser("user@admin.com", "abc123", "admin", "User", "Admin");
    await createAdminUser("business@user.com", "abc123", "business", "Business", "Admin");
    
    console.log("\nAdmin accounts created successfully!");
    console.log("You can now log in with:");
    console.log("  - User Admin: user@admin.com / abc123");
    console.log("  - Business Admin: business@user.com / abc123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin accounts:", error);
    process.exit(1);
  }
}

main();
