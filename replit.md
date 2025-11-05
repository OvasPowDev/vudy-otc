# Overview

This project is a Vudy OTC Hub application, designed as a platform for managing Over-The-Counter (OTC) cryptocurrency transactions. It provides a kanban-style interface for liquidity providers to manage transaction requests. Key capabilities include creating buy/sell requests, making offers, tracking transaction statuses, and managing bank accounts and crypto wallets. The application aims to streamline OTC trading processes, offering a robust and user-friendly experience for both requesters and liquidators.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite.
**UI Framework**: shadcn/ui (Radix UI, Tailwind CSS) for accessible, customizable components and Vudy OTC brand styling.
**State Management**: TanStack Query for server state; local React state for UI state.
**Routing**: React Router v6 for client-side routing with protected routes.
**Internationalization**: Custom context-based i18n supporting Spanish (default) and English.
**Design Decisions**: Component-based architecture, responsive design with a mobile-first approach, dark/light theme support.

## Backend Architecture

**Framework**: Express.js server on Node.js with TypeScript.
**Architecture Pattern**: REST API with route handlers and a data access layer.
**Design Decisions**: Separation of concerns, interface-based storage for testability, middleware for logging and error handling, CORS enabled.

## Data Storage

**Database**: PostgreSQL (Neon serverless).
**ORM**: Drizzle ORM for type-safe queries and migrations.
**Schema**: Shared `/shared/schema.ts` for type consistency.
**Key Tables**: `profiles`, `bank_accounts`, `wallets`, `transactions`, `otc_offers`, `notifications`.
**Design Decisions**: UUID primary keys, timestamp fields, JSONB for metadata, enum types for data integrity.

## Authentication & Authorization

**Strategy**: Integration with external Vudy API for OTP (One-Time Password) email verification.
**Flow**: User email -> Vudy API check -> OTP send -> OTP verification -> Session creation.
**Session Management**: Custom solution using localStorage and in-memory state (authManager).
**Protected Routes**: Client-side protection redirects unauthenticated users.
**Design Decisions**: Passwordless authentication via OTP, Vudy API key as environment variable, profile creation post-authentication.

# External Dependencies

**Vudy Authentication API**:
- Base URL: `https://api-stg.vudy.app/v1/auth`
- Endpoints: `/check-user`, `/send-otp`, `/verify-otp`, `/onboard`
- Authentication: API key (`x-api-key` header)
- Purpose: User verification and OTP-based authentication.

**Neon Database**: Serverless PostgreSQL database, connected via `DATABASE_URL`.

**UI Libraries**: Radix UI, Tailwind CSS, Lucide React, date-fns.

**Build Tools**: Vite, TypeScript, ESLint.

**Form Management**: React Hook Form, Zod, @hookform/resolvers.

**Drag & Drop**: @dnd-kit (for kanban board).

# Recent Changes

## November 05, 2025

### Dashboard Translation Fixes
- ✅ Fixed missing translations for dashboard statistics cards (totalTransactions, buyOrders, sellOrders, totalProcessed)
- ✅ Fixed KanbanBoard view toggle buttons (liquidatorView, requesterView) translations
- ✅ All dashboard elements now properly internationalized in Spanish and English

### Kanban Filters Feature
- ✅ Implemented comprehensive filtering system for Kanban board
- ✅ **Type filters**: Three button design - "Todas", "Compras", "Ventas"
- ✅ **Date filters**: Dropdown with Today, This week, This month, Custom range
- ✅ Created `KanbanFilters.tsx` component using shadcn Button and Select components
- ✅ Updated backend storage layer (`server/storage.ts`) with filter support
- ✅ Modified GET `/api/transactions` route to accept filter query params
- ✅ Smart refetch logic: waits for both dates when using custom range
- ✅ Removed separate Liquidator/Requester views - unified view shows all transactions
- ✅ Maintained existing Kanban column structure (pending, offer_made, escrow_created)
- ✅ Full i18n support for all filter UI elements

### Bug Fixes
- ✅ Fixed transaction creation error: `amountValue` now correctly sent as string instead of number
- ✅ Transactions now properly saved to database after creation
- ✅ Dashboard correctly displays created transactions after submission

### Real-Time Kanban Updates (SSE)
- ✅ Implemented Server-Sent Events (SSE) for real-time Kanban board updates
- ✅ **Backend**: Created `/events` endpoint with client management, heartbeat (25s), and cleanup
- ✅ **Backend**: Added `broadcast()` function to notify all connected clients
- ✅ **Backend**: Emit `tx.created` event after creating transaction
- ✅ **Backend**: Emit `tx.updated` event after updating transaction
- ✅ **Frontend**: SSE subscription in KanbanBoard with automatic reconnection
- ✅ **Frontend**: Client-side filter logic to show only relevant transactions
- ✅ **Frontend**: Type mapping: `fiat_to_crypto` → `buy`, `crypto_to_fiat` → `sell`
- ✅ **Frontend**: React Query cache invalidation for automatic UI refresh
- ✅ **No refresh needed**: New/updated transactions appear instantly in Kanban
- ✅ **Filter-aware**: Only shows transactions matching current type/date filters
- ✅ **Performance**: EventSource auto-reconnects, no external dependencies