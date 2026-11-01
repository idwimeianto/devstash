# Current Feature: Auth Phase 2 — Credentials (Email/Password) Provider

Add a Credentials provider for email/password sign-in, plus a registration API route.

## Status

In Progress

## Goals

- Use `bcryptjs` (already installed) for password hashing
- `password` field on `User` (already in `prisma/schema.prisma` as `String?`, so no migration expected)
- `src/auth.config.ts`: add a Credentials provider with an `authorize: () => null` placeholder (edge-safe)
- `src/auth.ts`: override the Credentials provider with real bcrypt validation against the database
- `POST /api/auth/register`:
  - Accepts `name`, `email`, `password`, `confirmPassword`
  - Validates that the passwords match
  - Rejects an email that already exists
  - Hashes the password with bcryptjs and creates the user
  - Returns a success/error response
- GitHub OAuth keeps working

## Notes

- Split pattern: `auth.config.ts` keeps the placeholder so the proxy (edge) never imports Prisma/bcrypt; `auth.ts` replaces it with the real `authorize`.
- Validate request input with Zod (coding standards). Zod is not installed yet, so it needs adding.
- Testing:
  1. Register via curl:
     ```bash
     curl -X POST http://localhost:3000/api/auth/register \
       -H "Content-Type: application/json" \
       -d '{"name":"Test","email":"test@test.com","password":"password123","confirmPassword":"password123"}'
     ```
  2. Go to `/api/auth/signin`
  3. Sign in with email/password
  4. Verify redirect to `/dashboard`
  5. Verify GitHub OAuth still works
- Reference: https://authjs.dev/getting-started/authentication/credentials

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial setup** — Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4; removed create-next-app boilerplate (default SVGs, starter page and styles); added `CLAUDE.md` and `context/` docs. (Completed)
- **Dashboard UI Phase 1** — initialized shadcn/ui (button, input, kbd) with lucide-react; added the `/dashboard` route and layout with Sidebar/Main placeholders; top bar with DevStash logo, search bar, and "New Collection" / "New Item" buttons (display only); made dark mode the default; fixed the Geist font variables in `globals.css`. (Completed)
- **Dashboard UI Phase 2** — collapsible sidebar using shadcn `sidebar` (collapses to icons on desktop, always a drawer on mobile) with the toggle inside the sidebar on desktop and in the top bar on mobile; collapsible "Types" group linking to `/items/<type>` with counts; collapsible "Collections" group with collapsible Favorites and Recent lists; user avatar area at the bottom; mock data from `src/lib/mock-data.ts`; item type icon/color map in `src/lib/item-type-display.ts`; top bar buttons become icon-only on small screens; rewrote `use-mobile` with `useSyncExternalStore`. (Completed)
- **Dashboard UI Phase 3** — main area with a "Dashboard" header; 4 stats cards (items, collections, favorite items, favorite collections); Recent Collections grid (6 newest) with "View all" link, cards tinted and left-bordered by their most common item type (falling back to the default type) and showing item count, description and type icons; Pinned items; 10 most recent items with type icon, pin/favorite markers, tags and date; dashboard queries over mock data in `src/lib/dashboard.ts`; added shadcn `card` and `badge`; added border and tint classes to `item-type-display.ts`. (Completed)
- **Prisma + Neon PostgreSQL Setup** — Prisma 7.10.1 (stable, chosen over the Prisma 8 release candidate) with Neon PostgreSQL via `@prisma/adapter-neon`; `prisma.config.ts` holds the schema, migrations and seed config, with migrations using `DIRECT_URL` (direct connection) and the app using pooled `DATABASE_URL`; initial schema in `prisma/schema.prisma` from the project overview (User, Item, ItemType, Collection, ItemCollection, Tag plus Auth.js Account, Session, VerificationToken) with foreign-key indexes and cascade deletes; `prisma-client` generator output to `src/generated/prisma` (gitignored, regenerated on `postinstall`); initial migration `init` applied to the Neon dev branch; re-runnable seed for the 7 system item types (`prisma/seed.ts`); shared client in `src/lib/prisma.ts`; `npm run db:test` (`scripts/test-db.ts`) and `npm run db:studio` scripts. (Completed)
- **Seed Data** — rewrote `prisma/seed.ts` with sample content in `prisma/seed-data.ts`: demo user `demo@devstash.io` / "Demo User" (password hashed with `bcryptjs`, 12 rounds; `isPro: false`; email verified), the 7 system item types, and 5 collections with 18 items (React Patterns: 3 TypeScript snippets; AI Workflows: 3 prompts; DevOps: 1 snippet, 1 command, 2 links; Terminal Commands: 4 commands; Design Resources: 4 links, all real URLs); each collection's default type set to its main type; re-runnable (upserts the user and types, recreates the demo user's collections and items); added `npm run db:seed`. (Completed)
- **Dashboard Collections** — dashboard Recent Collections and collection stats now come from the Neon database via Prisma instead of mock data; `src/lib/db/collections.ts` (`getRecentCollections`: 6 newest with item count, types ranked by use and main type falling back to the default type; `getCollectionStats`) with types in `src/types/collections.ts`; temporary `getCurrentUserId()` in `src/lib/db/users.ts` resolves the seeded demo user until Auth.js (calls `connection()` so queries run at request time); async `RecentCollections` and `StatsCards` server components wrapped in `<Suspense>` with skeleton fallbacks (`/dashboard` is now partially prerendered); card border/tint from the most-used type and icons for all types; item stats, Pinned / Recent Items and the sidebar still use mock data; removed unused mock collection helpers from `src/lib/dashboard.ts`. (Completed)
- **Dashboard Items** — dashboard Pinned / Recent Items and item stats now come from the Neon database via Prisma instead of mock data; `src/lib/db/items.ts` (`getPinnedItems`, `getRecentItems`: 10 most recent ordered by last used then created, `getItemStats`) with types in `src/types/items.ts`; async `PinnedItems` (renders nothing when there are no pinned items, no Suspense fallback) and `RecentItems` (skeleton fallback) server components wrapped in `<Suspense>`; `ItemCard` takes the database item shape with icon/border from the item type, tags and last-used/created date; `StatsCards` loads item and collection stats in parallel; seed items accept an optional `isPinned` flag, with the useDebounce & useLocalStorage snippet and the Code Review prompt pinned; `src/lib/dashboard.ts` is now unused and the sidebar still uses mock data. (Completed)
- **Stats & Sidebar** — sidebar item types and collections now come from the Neon database via Prisma instead of mock data (main area stats already did); `getItemTypesWithCounts` in `src/lib/db/items.ts` (system types plus the user's custom types with the user's item count, in the existing sidebar order) and `getSidebarCollections` in `src/lib/db/collections.ts` (favorites plus the 5 newest non-favorite collections, with item count and main type falling back to the default type), with types in `src/types/items.ts` and `src/types/collections.ts`; `SidebarTypes` and `SidebarCollections` load their lists in async server components wrapped in `<Suspense>`; favorites keep the folder and star icons, recent collections show a colored circle for their most-used type (new `bgColor` class in `item-type-display.ts`); empty Favorites / Recent lists are hidden; "View all collections" link to `/collections`; deterministic `SidebarListSkeleton` replaces shadcn's `SidebarMenuSkeleton`, whose `Math.random()` broke prerendering; seed collections accept an optional `isFavorite` flag, with React Patterns and AI Workflows marked as favorites; `SidebarUser` still uses mock data. (Completed)
- **Add Pro Badge to Sidebar** — subtle uppercase "PRO" badge (shadcn `Badge`, outline variant, small muted text) next to the File and Image types in the sidebar Types list, hidden when the sidebar is collapsed to icons; Pro types defined once in `PRO_ITEM_TYPES` with an `isProItemType()` helper in `src/lib/item-type-display.ts`; display only, no gating. (Completed)
- **Codebase Quick Wins** — low-risk fix from the code-scanner audit: `getCurrentUserId()` in `src/lib/db/users.ts` is wrapped in React's `cache()`, so the demo-user lookup runs once per request instead of once in each of the 6 dashboard server components; `connection()` and the `NO_USER_ID` fallback unchanged; other audit findings (collection query rewrites, `[userId, createdAt]` indexes, shared collection helper, splitting `SidebarCollections.tsx`, DB-backed sidebar user) deferred, and `mock-data.ts` / `dashboard.ts` left as is. (Completed)
- **Codebase Quick Wins 2** — low-risk fixes from the second code-scanner audit: `src/app/dashboard/error.tsx` error boundary with a "Try again" button (this Next.js version passes `retry`, not `reset`; it wraps the page content only, so sidebar queries in the layout are not covered); `getPinnedItems` capped by `PINNED_ITEMS_LIMIT` (10); `prisma/seed.ts` recreates the demo user's collections and items in one `$transaction` (30s timeout), refuses to run when `NODE_ENV` is production, and throws a clear error on an unknown seed type via `getTypeId()`; `BCRYPT_ROUNDS` exported from `prisma/seed-data.ts` and shared with `scripts/test-db.ts`; `getItemTypeDisplay()` accepts `null`, dropping the `?? ""` fallbacks; `CollectionCard` and `ItemCard` compose classes with `cn()`; removed `cursor-pointer` from `ItemCard`; removed the boilerplate comment in `next.config.ts`; `bcryptjs`, `dashboard.ts` and `mock-data.ts` left as is; collection query rewrites, `DIRECT_URL`, the system-type unique index, `[userId, createdAt]` indexes, missing routes, DB icon/color, the shared collection helper, splitting `SidebarCollections.tsx`, a DB-backed sidebar user and cross-user integrity checks deferred. (Completed)
- **Auth Phase 1 — NextAuth + GitHub Provider** — NextAuth v5 (`next-auth@5.0.0-beta.32`) with `@auth/prisma-adapter` 2.11.3 (its peer range stops at Prisma 6 but it type-checks against the Prisma 7 client); split config for edge compatibility: `src/auth.config.ts` (GitHub provider plus `jwt` / `session` callbacks that copy the user id into `session.user.id`, no adapter) and `src/auth.ts` (Prisma adapter on the shared `@/lib/prisma` client, `session: { strategy: "jwt" }`); `src/app/api/auth/[...nextauth]/route.ts` exports `GET` / `POST`; `src/proxy.ts` (`export const proxy = auth(...)`, matcher `/dashboard/:path*`) redirects signed-out users to NextAuth's default `/api/auth/signin` with a `callbackUrl`; `src/types/next-auth.d.ts` adds `user.id` to `Session`; existing Auth.js schema models already matched the adapter, so no migration; verified the redirect, the GitHub round trip and a new `github` Account row on the dev branch; the dashboard still shows the seeded demo user via `getCurrentUserId()`. (Completed)
