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

## November 05, 2025 (PM)

### Menu Internationalization
- ✅ **Updated Layout Component**:
  - Added useLanguage hook to Layout component
  - All menu items now use i18n translations (t('menu.*'))
  - Menu items properly translated in Spanish and English
  
- ✅ **Translation Updates**:
  - Added `menu.apiSettings` translation: "Configuración de API" (ES) / "API Settings" (EN)
  - Updated menu items: profile, apiSettings, signOut with proper translations
  - Added data-testid attributes for better testing: menu-profile, menu-api-settings, menu-sign-out

### API Keys & External Integration System
- ✅ **Database Schema Updates**:
  - Added `api_keys` table with fields: userId, name, keyHash, keyPrefix, lastUsedAt, isActive, createdAt, revokedAt
  - Added client fields to `transactions`: clientAlias, clientKycUrl, clientNotes, requestOrigin, internalNotes, slaMinutes
  - Created `requestOriginEnum` for tracking transaction source (whatsapp, api, form, manual)

- ✅ **Backend Infrastructure**:
  - Created storage methods for API key management (create, get, validate, revoke, generateApiKey)
  - Implemented `validateApiKey` middleware in `server/middleware/apiAuth.ts` for API authentication
  - API keys follow format `vdy_[64-char hex]` with SHA-256 hashing for storage
  - Only key prefix (first 11 chars) stored for display, full hash used for validation

- ✅ **External API Endpoint**:
  - Created `POST /api/external/transactions` endpoint in `server/externalRoutes.ts`
  - Accepts FTC (Fiat to Crypto) and CTF (Crypto to Fiat) transaction requests
  - Validates API key via `x-api-key` header
  - Supports client metadata: alias, KYC URL, notes, request origin, SLA

- ✅ **Swagger/OpenAPI Documentation**:
  - Installed swagger-jsdoc and swagger-ui-express packages
  - Created `server/swagger.ts` with complete API documentation
  - Swagger UI available at `/api-docs` with custom branding
  - Documented all schemas: Transaction, OtcOffer, ApiKey
  - Comprehensive JSDoc for external transaction endpoint

- ✅ **API Management Interface**:
  - Created `/api-settings` page with complete API key CRUD interface
  - Features: List keys, create new, revoke existing, view last used timestamp
  - Created `CreateApiKeyDialog` component with one-time key reveal
  - Security warning: Generated key shown only once with copy-to-clipboard
  - Added Layout component with dropdown menu including API Settings link

- ✅ **Frontend Components**:
  - Updated `TransactionDetailModal` to display client information section
  - Shows: clientAlias, KYC download link, client notes, request origin, SLA minutes
  - All labels properly internationalized in Spanish and English

- ✅ **Internationalization**:
  - Added complete Spanish and English translations for API Settings
  - Added translations for client information fields in transaction details
  - Translation keys: apiSettings.*, transactionDetail.*, common.*

- ✅ **Routes & Navigation**:
  - Added `/api-settings` route to App.tsx
  - Integrated API Settings link in user dropdown menu
  - Documentation link opens Swagger UI in new tab

- ✅ **Backend API Endpoints**:
  - `GET /api/api-keys?userId=X` - List user's API keys
  - `POST /api/api-keys` - Generate new API key (returns plainKey once)
  - `DELETE /api/api-keys/:id` - Revoke API key
  - `POST /api/external/transactions` - Create transaction via API (requires API key)

## November 05, 2025 (AM)

### Wallet & Bank Account Display Fix
- ✅ Fixed critical bug where wallets and bank accounts weren't displaying after creation
- ✅ Changed queryKey format from object to URL string: `/api/wallets?userId=${user?.id}`
- ✅ Updated cache invalidation to match new queryKey pattern in Wallets and BankAccounts components
- ✅ Fixed MakeOfferDialog to use correct queryKey format for fetching user's wallets and bank accounts
- ✅ Changed form validation mode from "onTouched" to "onChange" in BankAccounts for better UX

### MakeOffer Form UI Improvements
- ✅ Changed `etaMinutes` from text input to dropdown Select with options: 5, 10, 30, 60 minutes
- ✅ Updated Spanish translation for `etaMinutes` to "Tiempo de transacción (Min)"
- ✅ Updated `notes` label to "Notas" in Spanish and "Notes" in English
- ✅ Changed notes placeholder to "Ingresa una descripción" (ES) / "Enter a description" (EN)
- ✅ Added `submit` translation for offer form button
- ✅ Wallets dropdown now correctly shows user's wallets from their profile
- ✅ **FTC Form Reorganization**: Bank account selection moved to top of form (above amount and ETA)
- ✅ **Dynamic Currency**: Currency symbol automatically updates based on selected bank account for FTC transactions
- ✅ **Supported Currencies**: GTQ (Q), USD ($), MXN ($), VES (Bs), COP ($), ARS ($)
- ✅ **Bug Fix**: Corrected `amountValue` to send as string and `status` to send as 'open' when creating offers

### Transaction Detail Modal Enhancements
- ✅ **Title Update**: Changed from "Información de la Transacción" to "Transacción FTC/CTF - [Código]"
- ✅ **Offers Section**: Renamed to "Tu oferta" (singular)
- ✅ **Enhanced Offer Details**: 
  - Shows **"Tu cuenta para recibir el pago"**: Bank account information (name, account number, and currency) for FTC offers
  - Displays "Monto ofrecido" with currency
  - Shows "Tiempo de transacción" (ETA in minutes)
  - **Time Tracking**: Calculates and displays time elapsed from transaction creation to offer submission
  - **Offer Age**: Shows how long ago the offer was made (format: Xd Xh Xm)
  - Improved layout with better information hierarchy
- ✅ **Backend Enhancement**: Added `/api/bank-accounts/:id` endpoint to fetch individual bank accounts
- ✅ **Frontend Optimization**: Created `OfferDetail` component with individual bank account queries for better performance

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

### Multi-User OTC System with Offers & Escrow (November 05, 2025)
- ✅ **Database Schema Updates**:
  - Updated transaction statuses: `pending` → `escrow` → `completed` | `failed`
  - Added `winnerOtcId` field to transactions
  - Added `proofUploaded` boolean for crypto_to_fiat transactions
  - Updated offers table with status enum: `open` | `won` | `lost`

- ✅ **Backend API Endpoints**:
  - `POST /api/tx/:id/offer` - OTC makes offer on pending transaction
  - `POST /api/tx/:id/accept` - Client accepts offer (moves to escrow)
  - `POST /api/tx/:id/proof` - OTC uploads proof (CTF only)
  - `POST /api/tx/:id/validate` - Client validates and completes transaction

- ✅ **SSE Events Extended**:
  - `offer.created` - Broadcast when new offer is made
  - `tx.accepted` - Broadcast when client accepts offer
  - `tx.completed` - Broadcast when transaction is finalized

- ✅ **Frontend Kanban 4-Column System**:
  - **Pendientes**: Transactions waiting for offers
  - **Con mi oferta**: Transactions where user has made an offer
  - **Escrow creado**: Transactions in escrow (winner OTC or client view)
  - **Completada**: Finalized transactions

- ✅ **Storage Layer**:
  - Methods for creating/updating/querying offers
  - Multi-offer status updates (win/loss logic)
  - Transaction escrow workflow support