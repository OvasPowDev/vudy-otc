# Overview

This is a Vudy OTC Hub application - a platform for managing Over-The-Counter (OTC) cryptocurrency transactions. The application enables liquidity providers to view, respond to, and manage OTC trading requests through a kanban-style interface. Users can create buy/sell requests, make offers, track transaction statuses through multiple stages (pending, offer made, escrow created, completed), and manage their bank accounts and crypto wallets.

The platform is built as a full-stack TypeScript application using React + Vite for the frontend, Express.js for the backend, Drizzle ORM with Neon PostgreSQL for the database, and integrates with external Vudy authentication APIs for user management.

## Migration Status (Oct 31, 2025)

✅ **MIGRATION COMPLETE** - Successfully migrated from Lovable's Supabase-based architecture to Replit's fullstack environment:

### Infrastructure & Backend
- ✅ Converted Supabase schema to Drizzle ORM schema
- ✅ Migrated Supabase Edge Functions to Express API routes  
- ✅ Replaced Supabase Auth with custom OTP-based authentication using Vudy API
- ✅ Deployed database schema to Neon PostgreSQL
- ✅ Configured Express server to run on port 5000 with Vite integration
- ✅ Fixed server restart loop by configuring tsx to ignore vite config files
- ✅ Configured Vite with `allowedHosts: true` for Replit environment
- ✅ Created Supabase client stub to prevent initialization errors during migration

### Frontend Components & Pages
- ✅ Implemented custom authentication system (authManager + useAuth hook)
- ✅ Migrated Index.tsx to show dashboard with Express API
- ✅ Migrated Auth.tsx for OTP-based authentication with Vudy API
- ✅ Migrated Profile.tsx to use TanStack Query + Express API
- ✅ Migrated BankAccounts.tsx to use TanStack Query + Express API
- ✅ Created Wallets.tsx page for managing cryptocurrency wallets
- ✅ Migrated Transactions.tsx with full Kanban board functionality
- ✅ Migrated KanbanBoard.tsx with liquidator/requester views and transaction columns
- ✅ Migrated CreateTransactionDialog.tsx for creating FTC/CTF transactions
- ✅ Migrated MakeOfferDialog.tsx for making offers on transactions
- ✅ Migrated TransactionDetailModal.tsx for viewing transaction details
- ✅ Migrated AppHeader.tsx to use useAuth hook
- ✅ Migrated MobileMenu.tsx and UserProfile.tsx components
- ✅ Migrated useNotifications hook with polling-based system (replaces Supabase realtime)

### Key Design Decisions
- Custom User type from auth.ts replaces Supabase User type throughout frontend
- Polling-based notification system (30-second interval) instead of Supabase realtime subscriptions
- Storage layer includes all CRUD operations for profiles, bank accounts, wallets, transactions, offers, and notifications
- TanStack Query used for all server state management with proper cache invalidation
- Kanban board displays liquidator view (all pending transactions) vs requester view (user's own transactions)
- Backend GET /api/transactions supports optional userId parameter - omit for all transactions, provide for user-specific
- Transaction search without userId filter allows liquidators to find and offer on any user's transactions
- Query key alignment ensures cache invalidation properly refreshes UI after mutations

### Known Limitations
- Email and password update features removed (auth managed by Vudy API)
- No real-time features (using polling for notifications instead)
- Kanban board simplified without drag & drop functionality (transactions move via status updates)
- MakeOfferDialog removed inline wallet/bank creation - users must use dedicated Wallets/BankAccounts pages

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite for fast development and optimized production builds.

**UI Framework**: shadcn/ui component library built on Radix UI primitives, providing accessible and customizable components. Uses Tailwind CSS for styling with a custom design system based on Vudy OTC brand colors.

**State Management**: TanStack Query (React Query) for server state management, with local React state for UI state. No global state management library is used, keeping state close to components.

**Routing**: React Router v6 for client-side routing with protected routes that redirect unauthenticated users to the auth page.

**Internationalization**: Custom context-based i18n solution supporting Spanish (default) and English, with translations stored in `/client/src/lib/i18n.ts`.

**Key Design Decisions**:
- Component-based architecture with reusable UI components in `/client/src/components/ui/`
- Feature components in `/client/src/components/` handle business logic
- Pages in `/client/src/pages/` compose components into full views
- Dark/light theme support with theme preference stored in localStorage
- Responsive design with mobile-first approach and dedicated mobile menu

## Backend Architecture

**Framework**: Express.js server running on Node.js with TypeScript.

**Architecture Pattern**: Simple REST API with route handlers in `/server/routes.ts` and data access layer in `/server/storage.ts`.

**Development vs Production**:
- Development: Uses Vite middleware for HMR and instant updates
- Production: Serves static files from the built `/dist/public` directory

**Key Design Decisions**:
- Separation of concerns: routes handle HTTP, storage handles data access
- Interface-based storage pattern (`IStorage`) allows for easy testing and alternative implementations
- Middleware for request logging and error handling
- CORS enabled for API routes

## Data Storage

**Database**: PostgreSQL (configured for Neon serverless via `@neondatabase/serverless`)

**ORM**: Drizzle ORM for type-safe database queries and migrations.

**Schema Location**: `/shared/schema.ts` - shared between client and server for type consistency.

**Key Tables**:
- `profiles`: User profile information (first name, last name, phone, country)
- `bank_accounts`: User's fiat bank account details
- `wallets`: User's cryptocurrency wallet addresses
- `transactions`: OTC transaction requests with status tracking
- `otc_offers`: Offers made on transactions
- `notifications`: In-app notification system

**Design Decisions**:
- UUID primary keys for security and distributed system compatibility
- Timestamp fields (`created_at`, `updated_at`) for audit trails
- JSONB fields for flexible metadata storage (notifications payload/actions)
- Enum types for transaction types and statuses to ensure data integrity

## Authentication & Authorization

**Strategy**: Integration with external Vudy API for authentication via OTP (One-Time Password) email verification.

**Flow**:
1. User enters email
2. System checks if user exists via Vudy API (`/api/auth/check-user`)
3. New users provide additional info (name, country)
4. OTP sent to email via Vudy API (`/api/auth/send-otp`)
5. User enters 6-digit code
6. Code verified via Vudy API (`/api/auth/verify-otp`)
7. Session created using Supabase Auth

**Session Management**: Custom session management using localStorage and in-memory state (authManager singleton).

**Protected Routes**: Client-side route protection redirects unauthenticated users to `/auth`.

**Design Decisions**:
- No password storage - passwordless authentication via OTP
- Vudy API key stored as environment variable (`VUDY_API_KEY`)
- Development bypass endpoint for testing (`/api/auth/dev-bypass` for jose@jose.com)
- Profile creation happens after successful authentication

## External Dependencies

**Vudy Authentication API**:
- Base URL: `https://api-stg.vudy.app/v1/auth`
- Endpoints: `/check-user`, `/send-otp`, `/verify-otp`, `/onboard`
- Authentication: API key via `x-api-key` header
- Purpose: User verification and OTP-based authentication

**Neon Database**:
- Serverless PostgreSQL database
- Connection via `DATABASE_URL` environment variable
- WebSocket support for real-time features

**Authentication Stack**:
- Custom OTP-based email verification via Vudy API
- Session management (currently being implemented)
- Dev bypass endpoint for testing (`/api/auth/dev-bypass` for jose@jose.com)

**UI Libraries**:
- Radix UI: Accessible component primitives
- Tailwind CSS: Utility-first styling
- Lucide React: Icon library
- date-fns: Date formatting and manipulation

**Build Tools**:
- Vite: Frontend build tool and dev server
- TypeScript: Type safety across the stack
- ESLint: Code linting with TypeScript support

**Form Management**:
- React Hook Form: Form state management
- Zod: Schema validation
- @hookform/resolvers: Integration between React Hook Form and Zod

**Drag & Drop**:
- @dnd-kit: Accessible drag-and-drop for kanban board

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `VUDY_API_KEY`: API key for Vudy authentication service
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: PostgreSQL connection details (auto-configured by Replit)