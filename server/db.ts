import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
const isSupabase = connectionString.includes('supabase');

export const pool = new Pool({ 
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined
});
export const db = drizzle({ client: pool, schema });
