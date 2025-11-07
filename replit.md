# Overview

This project is the Vudy OTC Hub, a platform designed for managing Over-The-Counter (OTC) cryptocurrency transactions. It provides a kanban-style interface enabling liquidity providers to handle transaction requests efficiently. The application supports creating buy/sell requests, making and accepting offers, tracking transaction statuses, and managing associated bank accounts and crypto wallets. Its primary goal is to streamline OTC trading through a robust and user-friendly experience for both requesters and liquidators. The project aims to capture a significant share of the OTC crypto market by offering a superior and efficient trading solution.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite.
**UI Framework**: shadcn/ui (Radix UI, Tailwind CSS) for accessible and customizable components.
**State Management**: TanStack Query for server state; local React state for UI state.
**Routing**: React Router v6 with protected routes.
**Internationalization**: Custom context-based i18n supporting Spanish (default) and English.
**Design Decisions**: Component-based, responsive with a mobile-first approach, dark/light theme support.
**Core Features**: Kanban board for transaction management, wallet & bank account management, API key management, real-time updates via SSE, dynamic transaction amount fields, multi-company registration with email activation.

## Backend Architecture

**Framework**: Express.js server on Node.js with TypeScript.
**Architecture Pattern**: REST API with route handlers and a data access layer.
**Design Decisions**: Separation of concerns, interface-based storage for testability, middleware for logging and error handling, CORS enabled.
**Core Features**: Transaction creation and management, offer system (create, accept), API for external transaction creation, user and company registration, email activation.

## Data Storage

**Database**: PostgreSQL (Neon serverless).
**ORM**: Drizzle ORM for type-safe queries and migrations.
**Schema**: Shared `/shared/schema.ts` for type consistency.
**Key Tables**: `profiles`, `bank_accounts`, `wallets`, `transactions`, `otc_offers`, `notifications`, `api_keys`, `companies`, `activation_tokens`.
**Design Decisions**: UUID primary keys, timestamp fields, JSONB for metadata, enum types for data integrity.

## Authentication & Authorization

**Strategy**: Integration with external Vudy API for OTP email verification.
**Flow**: User email -> Vudy API check -> OTP send -> OTP verification -> Session creation. Multi-company registration includes an email activation step before full account activation via Vudy API.
**Session Management**: Custom solution using localStorage and in-memory state (authManager).
**Protected Routes**: Client-side protection redirects unauthenticated users.
**Design Decisions**: Passwordless authentication via OTP, Vudy API key as environment variable, profile creation post-authentication, user status (pending/active/inactive) for registration flow.

# External Dependencies

**Vudy Authentication API**:
- Base URL: `https://api-stg.vudy.app/v1/auth`
- Endpoints: `/check-user`, `/send-otp`, `/verify-otp`, `/onboard`
- Purpose: User verification, OTP-based authentication, and business onboarding.

**Neon Database**: Serverless PostgreSQL database.

**UI Libraries**: Radix UI, Tailwind CSS, Lucide React, date-fns.

**Build Tools**: Vite, TypeScript, ESLint.

**Form Management**: React Hook Form, Zod, @hookform/resolvers.

**Drag & Drop**: @dnd-kit (for kanban board).

**API Documentation**: `swagger-jsdoc`, `swagger-ui-express`.

**Email Service**: Resend API (for sending activation emails).

# Recent Changes

## November 07, 2025 - Multi-Company Registration System

### Database Expansion
- Created `companies` table (id, name, address, website, phone, email, logo, createdAt)
- Modified `profiles` table: Added companyId, status (pending/active/inactive), role (admin/user), username, vudyUserId
- Created `activation_tokens` table (id, token UUID, userId, expiresAt, used, createdAt)

### Registration Wizard - Simplified 2-Step Process
**Step 1 - Company Information**:
- Company name (required)
- Corporate email (optional)
- Phone (optional)
- Address (optional)
- Website (optional)

**Step 2 - Administrator Email** (Simplified):
- Only asks for administrator email
- Email automatically used as username for login
- Default values: firstName="Admin", lastName=CompanyName, country="SV"
- Simpler UX with less friction during registration

### Backend Registration Flow
- Endpoint: `POST /api/auth/register`
- Creates company record
- Creates user profile with status='pending'
- Email automatically used as username
- Generates UUID activation token (24-hour expiry)
- Sends activation email via Resend (or logs to console if no API key)
- Validates email uniqueness

### Email Activation System
- Activation route: `/activate/:token`
- Endpoint: `GET /api/auth/activate/:token`
- Validates token (expiry, single-use)
- Calls Vudy `/v1/auth/onboard` with isBusiness=true
- On success: Updates status='active', stores vudyUserId, marks token used
- On failure: Shows retry button (token remains valid)
- Auto-redirects to dashboard on success

### Security Features
- UUID-based tokens (cryptographically secure)
- 24-hour token expiration
- Single-use tokens (marked 'used' after successful activation)
- Email uniqueness validation
- Status-based access control (pending/active/inactive)

### Frontend Updates
- React Router v6 (migrated from Wouter)
- Routes: `/register`, `/activate/:token`
- "Crear cuenta" link on login page
- Activation page with loading/success/error states
- Status check prevents pending users from accessing dashboard

### Registration Flow Summary
1. User visits `/register` → Fills company info (Step 1) → Enters admin email (Step 2)
2. Backend creates company → Creates pending user with email as username → Generates token → Sends email
3. User clicks activation link → System validates token
4. Backend calls Vudy onboard with business data
5. On success: User marked 'active' → Auto-login → Dashboard
6. On failure: Retry button shown (token remains valid)