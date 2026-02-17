/**
 * Drizzle Kit configuration for database migrations and schema management.
 * 
 * Configures the PostgreSQL database connection and schema locations for the ExploreSG Rewards application.
 * Requires the DATABASE_URL environment variable to be set.
 * 
 * @throws {Error} If DATABASE_URL environment variable is not defined
 * 
 * @example
 * // Ensure DATABASE_URL is set in your .env file before running migrations
 * DATABASE_URL=postgresql://user:password@localhost:5432/explorerewards
 */
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
