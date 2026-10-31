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
