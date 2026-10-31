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
