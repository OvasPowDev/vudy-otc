# Overview

This project is a Vudy OTC Hub application, a platform for managing Over-The-Counter (OTC) cryptocurrency transactions. It provides a kanban-style interface for liquidity providers to manage transaction requests. Key capabilities include creating buy/sell requests, making offers, tracking transaction statuses, and managing bank accounts and crypto wallets. The application aims to streamline OTC trading processes, offering a robust and user-friendly experience for both requesters and liquidators.

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
**Key Tables**: `profiles`, `bank_accounts`, `wallets`, `transactions`, `otc_offers`, `notifications`, `api_keys`.
**Design Decisions**: UUID primary keys, timestamp fields, JSONB for metadata, enum types for data integrity.

## Authentication & Authorization

**Strategy**: Integration with external Vudy API for OTP (One-Time Password) email verification.
**Flow**: User email -> Vudy API check -> OTP send -> OTP verification -> Session creation.
**Session Management**: Custom solution using localStorage and in-memory state (authManager).
**Protected Routes**: Client-side protection redirects unauthenticated users.
**Design Decisions**: Passwordless authentication via OTP, Vudy API key as environment variable, profile creation post-authentication.

## Core Features

-   **Transaction Management**: Create, view, and manage buy/sell (FTC/CTF) requests.
-   **Offer System**: Liquidators can make offers on pending transactions; requesters can accept offers.
-   **Kanban Board**: Visual management of transaction states (Pending, Offer Made, Escrow Created, Completed) with filtering by type and date.
-   **Wallet & Bank Account Management**: Users can add and manage their crypto wallets and bank accounts.
-   **Real-time Updates**: Server-Sent Events (SSE) for instant Kanban board updates.
-   **API Key Management**: Users can generate and manage API keys for external transaction creation.
-   **Internationalization**: Full support for Spanish and English across the application.
-   **External API Integration**: Endpoint for creating transactions via an external API key.

# External Dependencies

**Vudy Authentication API**:
-   Base URL: `https://api-stg.vudy.app/v1/auth`
-   Endpoints: `/check-user`, `/send-otp`, `/verify-otp`, `/onboard`
-   Authentication: API key (`x-api-key` header)
-   Purpose: User verification and OTP-based authentication.

**Neon Database**: Serverless PostgreSQL database, connected via `DATABASE_URL`.

**UI Libraries**: Radix UI, Tailwind CSS, Lucide React, date-fns.

**Build Tools**: Vite, TypeScript, ESLint.

**Form Management**: React Hook Form, Zod, @hookform/resolvers.

**Drag & Drop**: @dnd-kit (for kanban board).

**API Documentation**: `swagger-jsdoc`, `swagger-ui-express`.

# Recent Changes

## November 06, 2025 (Evening)

### Navigation Menu Reorganization
- ✅ **Moved Profile Dropdown to Welcome Card**:
  - Removed "Perfil" dropdown from main navigation menu
  - Profile menu (Perfil, Cuentas, Wallets, API) now appears as dropdown under "Welcome, [email]" card
  - Added chevron-down icon to indicate dropdown functionality
  - Cleaner navigation menu with only Dashboard and Transacciones
  - UserProfile component now handles dropdown menu with internationalization support

## November 06, 2025 (Late PM)

### Enhanced Profile Management System
- ✅ **Clickable User Profile in Header**:
  - User profile card in desktop header now navigates to `/profile` on click
  - Added hover effect and cursor pointer for better UX
  - data-testid added for testing
  
- ✅ **Comprehensive Profile Page (Tabbed Interface)**:
  - **Tab 1 - Personal**: First name, last name, phone, country, email (read-only)
  - **Tab 2 - Photos**: Upload profile photo and company logo (image upload with preview)
  - **Tab 3 - Company**: Company name, address, website, phone (optional), email
  - **Tab 4 - Security**: Change password form with validation (min 8 chars, confirm match)
  
- ✅ **Database Schema Updates**:
  - Added to `profiles` table: profilePhoto, companyLogo, companyName, companyAddress, companyWebsite, companyPhone, companyEmail, passwordHash
  - All fields nullable for flexibility
  - Supports base64 image storage for photos and logos
  
- ✅ **Backend Implementation**:
  - New endpoint: `POST /api/profiles/:id/change-password`
  - Password hashing with bcrypt (10 salt rounds)
  - Image upload via base64 encoding (max 5MB, validated on frontend)
  - Full validation for company data (URL format for website, email format)
  
- ✅ **Form Validation**:
  - Zod schemas for all forms: personal, company, password
  - Real-time validation with error messages
  - Password confirmation matching
  - URL and email format validation

- ✅ **Profile Loading States**:
  - Separated loading states per mutation (updateProfileMutation, updateCompanyMutation, changePasswordMutation)
  - Individual loading states for image uploads (uploadingPhoto, uploadingLogo)
  - Error handling with automatic preview rollback on failed uploads
  - Accurate UI feedback with disabled buttons and spinners during operations

### Mobile-First Dashboard UI Improvements
- ✅ **Responsive Statistics Grid**:
  - Mobile/tablet: 2-column layout (`grid-cols-2`)
  - Desktop: 4-column layout (`lg:grid-cols-4`)
  - Optimized spacing (gap-3 on mobile, gap-4 on larger screens)
  
- ✅ **Enhanced Icons with Colors**:
  - Total Transactions: TrendingUp icon (blue) - represents activity growth
  - Buy Orders (CTF): ShoppingCart icon (green) - represents crypto to fiat purchases
  - Sell Orders (FTC): Wallet icon (orange) - represents fiat to crypto sales
  - Total Processed: CircleDollarSign icon (purple) - represents money processed
  
- ✅ **Mobile Typography Optimization**:
  - Accessible text sizes (text-xs / 12px minimum) meeting WCAG standards
  - Icons sized appropriately (h-5 w-5 on mobile, h-6 w-6 on desktop)
  - Compact vertical spacing with `leading-tight` for better density
  - Responsive title sizing (text-xs sm:text-sm)