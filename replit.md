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