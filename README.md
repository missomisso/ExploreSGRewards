# ExploreSG Rewards

## Overview

ExploreSG Rewards is a tourist companion web application for Singapore that gamifies exploration through a "Treasure Hunt" style gameplay system. Users discover locations, complete missions with various tasks (GPS check-ins, photo uploads, quizzes, QR codes), earn points, and redeem rewards from local businesses. The platform serves both tourists seeking engaging experiences and businesses looking to drive foot traffic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Animations**: Framer Motion for interactive elements
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with Zod schema validation
- **Session Management**: Express sessions with PostgreSQL store option

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless driver
- **Schema Location**: `shared/schema.ts` defines all tables using Drizzle
- **Key Tables**: users, missions, userMissions, submissions, rewards, userRewards
- **Migrations**: Managed via `drizzle-kit push`

### Application Structure
```
client/          # React frontend application
  src/
    components/  # UI components (shadcn/ui + custom)
    pages/       # Route components
    hooks/       # Custom React hooks
    lib/         # Utilities and query client
server/          # Express backend
  routes.ts      # API endpoint definitions
  storage.ts     # Database access layer
  db.ts          # Database connection
shared/          # Shared code between client/server
  schema.ts      # Drizzle database schema + Zod validators
```

### Key Design Patterns
- **Storage Pattern**: `IStorage` interface abstracts database operations for testability
- **Schema Sharing**: Drizzle schemas in `shared/` generate both TypeScript types and Zod validators
- **API Client**: Centralized fetch wrapper in `queryClient.ts` with error handling

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL (`@neondatabase/serverless`)
- **Connection**: Requires `DATABASE_URL` environment variable

### Authentication & Backend Services
- **Supabase Auth**: Authentication via Supabase (email/password, Google OAuth, GitHub OAuth)
- **Session Storage**: PostgreSQL-backed sessions via `connect-pg-simple`
- **Auth Files**: 
  - `server/supabase.ts` - Supabase admin client and JWT verification
  - `client/src/hooks/use-supabase-auth.ts` - React auth hook
  - `client/src/pages/auth/` - Login, Signup, and OAuth callback pages
- **Client Hook**: `client/src/hooks/use-auth.ts` exports useSupabaseAuth
- **Auth Routes**: `/auth/login`, `/auth/signup`, `/auth/callback`
- **API Routes**: `/api/auth/sync` (syncs authenticated user to database), `/api/config/supabase` (provides Supabase config to frontend)

### Database Connection
- **Supabase PostgreSQL**: User's own Supabase database via DATABASE_URL
- **SSL Workaround**: Using `NODE_TLS_REJECT_UNAUTHORIZED=0` for Supabase SSL
- **Environment Variables**: `DATABASE_URL`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### Frontend Libraries
- **Radix UI**: Complete primitive component set for accessibility
- **Embla Carousel**: Carousel functionality
- **react-day-picker**: Date selection
- **Vaul**: Drawer component
- **cmdk**: Command palette

### Development & Build
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **Replit Plugins**: Dev banner, cartographer, runtime error overlay
