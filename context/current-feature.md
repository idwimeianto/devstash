# Current Feature

<!-- Feature name and short description -->

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Goals and Requirements -->

## Notes

<!-- Any Extra Notes -->

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
