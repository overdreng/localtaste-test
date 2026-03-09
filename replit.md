# Local Taste - Homemade Food Delivery Marketplace

## Overview
A web platform connecting home cooks with customers who want to order quality homemade food with delivery. Works as a marketplace intermediary between cooks and clients. Rebranded from "HomeFeast" to "Local Taste" with warm orange branding.

## Architecture
- **Frontend**: React + TypeScript with Tailwind CSS, Shadcn UI components, wouter routing, TanStack Query
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Dual auth system — email/password registration + Replit Auth (OpenID Connect)
- **File Storage**: Replit Object Storage for photo uploads
- **i18n**: Custom EN/RU language system (`client/src/lib/i18n.tsx`), defaults to Russian, persisted in localStorage

## Branding
- **Brand name**: "Local Taste" (same in both EN and RU)
- **Logo**: `/images/logo.jpg` (served from `client/public/images/`)
- **Primary color**: `hsl(35 92% 50%)` (warm orange)
- **Hero image**: `/images/hero-food.png`

## User Roles
- **Guest**: Browse dishes and cooks, view menu
- **Client**: Browse, order, review, manage favorites and cart
- **Cook**: Manage menu, handle orders, view earnings
- **Admin/Moderator**: Manage cooks, verify applications, view analytics
- **Support**: Customer support role

## Key Features (MVP)
- **Open landing page** — guests see cooks immediately without login; auth modal for login/register
- Email/password registration with role selector (client/cook), phone, address fields
- Replit Auth (OIDC) as alternative login method
- Full EN/RU language switching via `LanguageToggle` component
- **2-level navigation**: Landing page shows cook cards → clicking a cook opens their dish menu with category filtering
- Landing page rating filter (4+ stars)
- Dish detail pages with nutritional info
- Shopping cart → checkout page → order placement
- Order tracking with polling-based status notifications (15s interval)
- Cook registration and verification
- Cook dashboard with sub-pages: overview, orders, menu, stats (`/dashboard/:tab`)
- Review and rating system
- Favorites
- Moderator panel (`/moderator`) — cook approvals with rejection reasons
- Admin panel (`/admin`) — cook approvals, user management (role changes), orders, analytics
- Currency: ₸ (tenge) throughout

## Project Structure
```
client/src/
  pages/          - Page components (landing, home, cart, orders, etc.)
  components/     - Shared components (dish-card, cook-card, auth-modal, language-toggle, ObjectUploader, ui/)
  hooks/          - Custom hooks (use-auth, use-upload, use-toast)
  lib/            - Utils (queryClient, auth-utils, i18n)
server/
  index.ts        - Express server entry
  routes.ts       - All API routes
  storage.ts      - DatabaseStorage implementing IStorage
  db.ts           - Drizzle database connection
  seed.ts         - Seed data for demo
  replit_integrations/  - Auth and object storage modules
shared/
  schema.ts       - Drizzle schema with all tables and types
  models/auth.ts  - Auth-specific schema (users, sessions)
```

## i18n System
- `client/src/lib/i18n.tsx` - `LanguageProvider` context, `useTranslation()` hook, all translation keys
- `client/src/components/language-toggle.tsx` - Toggle button showing "RU"/"EN"
- Default language: Russian (`ru`)
- All pages use `t("key")` for user-visible text
- Category names: `cat.name` (EN) / `cat.nameRu` (RU), selected by `lang`
- Dates formatted with locale from `lang` (e.g., `ru-RU` / `en-US`)

## Database Tables
- users, sessions (auth)
- user_profiles, cook_profiles
- categories, dishes
- orders, order_items
- reviews, favorites, cart_items

## Security
- Role-based authorization middleware (`requireRole`) guards admin/moderator endpoints
- Ownership checks on cart items, orders, and cook dishes
- Zod request validation on cart, orders, reviews, favorites, cook profiles
- Admin routes restricted to admin/moderator roles

## Technical Notes
- Object storage route uses regex `/^\\/objects\\/(.+)$/` (Express 5 path-to-regexp compatibility)
- Seed data uses hardcoded IDs (`seed-cook-1`, etc.) with `onConflictDoNothing()`
- `apiRequest(method, url, data)` — parameter order matters
- Stack: fullstack TypeScript, Express 5, Drizzle ORM, wouter, TanStack Query, Shadcn UI

## API Endpoints
- `/api/auth/register` - Email/password registration (POST)
- `/api/auth/login` - Email/password login (POST)
- `/api/auth/logout` - Logout (POST)
- `/api/auth/user` - Current user (GET, works with both auth methods)
- `/api/login` - Replit Auth OIDC login (GET, redirect)
- `/api/user/profile` - User profile with role
- `/api/dishes`, `/api/dishes/:id` - Browse dishes
- `/api/categories` - Dish categories
- `/api/cart`, `/api/cart/count` - Cart management (ownership-checked)
- `/api/orders` - Order management (client-scoped)
- `/api/reviews` - Review system (validated rating 1-5)
- `/api/favorites` - Favorites
- `/api/cook-profiles` - Cook application
- `/api/cook/*` - Cook dashboard endpoints (cook ownership-checked)
- `/api/cooks` - Approved cooks list with dish counts and previews
- `/api/cooks/:id` - Public cook profile with dishes and reviews
- `/api/admin/*` - Admin panel endpoints (admin/moderator role required)
