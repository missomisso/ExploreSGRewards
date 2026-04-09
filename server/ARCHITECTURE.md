# ExplorerSG Backend Architecture

This document describes the modular architecture of the ExplorerSG backend API. The API is built using Express.js and designed to be scalable, maintainable, and deployable both as a traditional HTTP server for local development and as serverless functions (e.g., on Vercel).

## Directory Structure

The `server/` directory is organized into distinct domain boundaries:

```
server/
├── routes/        # Controller layer containing route definitions
├── storage/       # Data access layer (Repository pattern) communicating with Supabase
├── utils/         # Shared utilities and helpers
├── index.ts       # Main local server bootstrap (loads Vite and listens on a port)
└── ARCHITECTURE.md # This documentation file
```

### 1. `routes/` (Controllers)
This directory contains individual `express.Router()` modules grouped by domain:
- **`auth.ts`**: Handles Supabase user sync, admin verification, and DB checks.
- **`missions.ts`**: Handles fetching, creating, and completing missions/tasks.
- **`rewards.ts`**: Handles creating rewards and user redemption logic.
- **`submissions.ts`**: Handles manual task submissions (photo, receipt handling).
- **`users.ts`**: General user profile and leaderboard endpoint.
- **`notifications.ts`**: Handles reading/marking notifications.
- **`admin.ts`**: Aggregated endpoints used exclusively by platform admins.
- **`index.ts`**: The master router that binds all sub-routers to the `/api` prefix and exposes `registerRoutes` for bootstrap.

### 2. `storage/` (Repositories)
The storage layer removes all database logic from the controllers. It connects to the `supabaseAdmin` client. 
- **`users.ts`**: Queries for user profiles and leaderboards.
- **`missions.ts`**: Queries for fetching/creating missions and saving user mission progress.
- **`submissions.ts`**: Queries for fetching pending and complete submissions.
- **`rewards.ts`**: Logic for reading active rewards and logging claimed rewards.
- **`notifications.ts`**: Logic for managing notification queue and read status.
- **`index.ts`**: Exports the unified `sbStorage` object so legacy seed scripts and cross-domain logic can cleanly access the entire DB layer.

### 3. `utils/`
- **`mappers.ts`**: Centralized mapping functions (`mapUser`, `mapMission`) that ensure raw database queries are correctly formatted into clean JSON objects and camelCase keys before being dispatched to the frontend.
- **`auth.ts`**: Houses the strict `requireAuth` middleware used across protected routes.

## The API Lifecycle

When a typical request hits the backend (e.g. `POST /api/tasks/complete`):
1. **Entrypoint**: `api/index.ts` (Vercel) or `server/index.ts` (Local/Replit) receives the request.
2. **Router (`server/routes/index.ts`)**: Routes the request to the specific domain router (in this case, `server/routes/missions.ts`).
3. **Controller (`missions.ts`)**: Evaluates the payload, validates request shape, and delegates to the Data layer.
4. **Storage (`server/storage/missions.ts`)**: Executes the query using `supabaseAdmin`, handling direct database fetching.
5. **Mapper (`utils/mappers.ts`)**: The raw database row is formatted cleanly.
6. **Response**: The Controller finishes processing point modifications if any exist, and returns the response payload back to the client.

## Development Workflows

- Run `npm run check` to ensure TypeScript mappings align perfectly.
- Start the server using `npm run dev` (local fallback) or Vercel local environments.

By adhering to this modular structure, the backend remains lightweight, avoids massive 1,000+ line monolithic files, and easily scales as new domains (like `analytics` or `payments`) are added.
