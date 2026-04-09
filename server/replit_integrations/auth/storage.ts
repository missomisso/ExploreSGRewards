import { type User, type UpsertUser } from "@shared/models/auth";
import { sbStorage } from "../../storage";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await sbStorage.getUser(id);
    return user as any;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    let user = await sbStorage.getUser(userData.id!);
    if (user) {
      await sbStorage.updateUser(userData.id!, userData as any);
    } else {
      await sbStorage.createUser(userData as any);
    }
    const updated = await sbStorage.getUser(userData.id!);
    return updated as any;
  }
}

export const authStorage = new AuthStorage();
