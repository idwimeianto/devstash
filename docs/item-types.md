# Item Types

DevStash ships with 7 **system item types**. Every item belongs to exactly one type, and the type decides which content fields the item uses and how it looks in the UI.

Sources: `context/project-overview.md`, `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/seed-data.ts`, `src/lib/item-type-display.ts`, `src/lib/db/items.ts`, `src/components/dashboard/*`.

> `src/lib/constants.tsx` (listed as a source in the research prompt) does not exist. The type display constants live in `src/lib/item-type-display.ts`.

---

## Overview

| Type    | Content kind | Icon (Lucide) | Color     | Plan | Route             | Sidebar order |
| ------- | ------------ | ------------- | --------- | ---- | ----------------- | :-----------: |
| Snippet | `TEXT`       | `Code`        | `#3b82f6` | Free | `/items/snippets` | 1             |
| Prompt  | `TEXT`       | `Sparkles`    | `#8b5cf6` | Free | `/items/prompts`  | 2             |
| Command | `TEXT`       | `Terminal`    | `#f97316` | Free | `/items/commands` | 3             |
| Note    | `TEXT`       | `StickyNote`  | `#fde047` | Free | `/items/notes`    | 4             |
| File    | `FILE`       | `File`        | `#6b7280` | Pro  | `/items/files`    | 5             |
| Image   | `FILE`       | `Image`       | `#ec4899` | Pro  | `/items/images`   | 6             |
| Link    | `URL`        | `Link`        | `#10b981` | Free | `/items/links`    | 7             |

- **Name** is stored lowercase (`snippet`, `prompt`, …). The label and route are derived from it: `getItemTypeLabel()` capitalizes and adds an "s" ("Snippets"), and `getItemTypeHref()` returns `/items/<name>s`.
- **Sidebar order** comes from `SYSTEM_TYPE_ORDER` in `src/lib/db/items.ts`. Custom types (not built yet) would follow, sorted by name. The project overview lists the types in a different order (Note before Command, Link before File), but the code uses the order above.
- **Pro** types are defined once in `PRO_ITEM_TYPES` (`file`, `image`) in `item-type-display.ts`. For now this only shows a "PRO" badge in the sidebar. Nothing is gated yet.
- The `/items/<type>` routes are linked from the sidebar, but the pages don't exist yet.

---

## Per-type details

### Snippet

- **Icon / color:** `Code`, `#3b82f6` (blue)
- **Purpose:** Reusable code such as hooks, components, utility functions and Dockerfiles.
- **Key fields:** `content` (the code), `language` (for syntax highlighting, e.g. `typescript`, `dockerfile`), `description`
- **Seed examples:** "useDebounce & useLocalStorage Hooks" (pinned), "Compound Tabs Component", "Everyday Utility Functions", "Next.js Dockerfile"

### Prompt

- **Icon / color:** `Sparkles`, `#8b5cf6` (purple)
- **Purpose:** AI prompts, system messages and workflow instructions. The seed prompts use a `{{code}}` placeholder.
- **Key fields:** `content` (prompt text), `description`. The seed sets no `language`.
- **Seed examples:** "Code Review" (pinned), "Generate Documentation", "Refactoring Assistant"
- **Planned AI feature:** Prompt Optimizer (Pro)

### Command

- **Icon / color:** `Terminal`, `#f97316` (orange)
- **Purpose:** Shell and terminal commands you keep re-typing or looking up.
- **Key fields:** `content` (the command, usually one line), `language` (`bash` in all seed data), `description`
- **Seed examples:** "Undo Last Commit" (`git reset --soft HEAD~1`), "Docker Cleanup", "Kill Process on Port", "Find Outdated Packages", "Production Deploy"

### Note

- **Icon / color:** `StickyNote`, `#fde047` (yellow)
- **Purpose:** Free-form Markdown notes, explanations and course notes.
- **Key fields:** `content` (Markdown), `description`. `language` is optional (`markdown` in mock data).
- **Seed examples:** none. The seed creates no notes; only `src/lib/mock-data.ts` has some.

### File

- **Icon / color:** `File`, `#6b7280` (gray)
- **Purpose:** Uploaded documents and context files (e.g. a `CLAUDE.md` template). Stored in Cloudflare R2.
- **Key fields:** `fileUrl`, `fileName`, `fileSize` (bytes), `description`. `content` is null.
- **Plan:** Pro
- **Seed examples:** none. Only mock data has one (`CLAUDE.md`, 2048 bytes). Uploads aren't built yet.

### Image

- **Icon / color:** `Image`, `#ec4899` (pink)
- **Purpose:** Screenshots, diagrams and other images. Stored in Cloudflare R2.
- **Key fields:** `fileUrl`, `fileName`, `fileSize` (bytes), `description`. `content` is null.
- **Plan:** Pro
- **Seed examples:** none. Only mock data has one (`architecture.png`, 184320 bytes).

### Link

- **Icon / color:** `Link`, `#10b981` (green)
- **Purpose:** Bookmarks to docs, tools and references.
- **Key fields:** `url`, `description`. `content` and `language` are null.
- **Seed examples:** "Docker Docs", "GitHub Actions Docs", "Tailwind CSS Docs", "shadcn/ui", "Material Design 3", "Lucide Icons"

---

## Content kind classification

Each item stores a `contentType` (the `ContentType` enum: `TEXT`, `URL`, `FILE`), and that decides which group of columns on `Item` it fills:

| Content kind | Types                            | Fields used                       | Fields left null                         |
| ------------ | -------------------------------- | --------------------------------- | ---------------------------------------- |
| `TEXT`       | snippet, prompt, command, note   | `content`, `language` (optional)  | `fileUrl`, `fileName`, `fileSize`, `url` |
| `URL`        | link                             | `url`                             | `content`, `language`, file fields       |
| `FILE`       | file, image                      | `fileUrl`, `fileName`, `fileSize` | `content`, `language`, `url`             |

**What enforces this today:**

- `ItemType` has **no** content kind column. Which kind goes with which type is only a convention.
- The only code that applies it is `toItemData()` in `prisma/seed.ts`: `link` → `URL`, everything else → `TEXT`. The seed has no file or image items.
- Nothing in the database stops an item from having a mismatched `contentType` and type (e.g. a `link` with `contentType: TEXT`) or from filling the "wrong" columns. Item create and edit (not built yet) will need to check this, e.g. with a Zod schema keyed on the type.

---

## Shared properties

### All items, whatever the type (`Item` model)

| Field                    | Notes                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| `id`                     | cuid                                                                |
| `title`                  | required                                                            |
| `description`            | optional; shown on item cards                                       |
| `contentType`            | `TEXT` / `URL` / `FILE`                                             |
| `isFavorite`             | star marker; counted in stats                                       |
| `isPinned`               | shown in the dashboard "Pinned" section (max 10)                    |
| `lastUsedAt`             | powers "Recent items"; falls back to `createdAt`                    |
| `userId`                 | owner; cascade delete with the user                                 |
| `typeId`                 | the item type; `onDelete: Restrict` (a type in use can't be deleted) |
| `tags`                   | many-to-many with per-user `Tag`                                    |
| `collections`            | many-to-many through `ItemCollection` (`addedAt`)                   |
| `createdAt`, `updatedAt` | timestamps                                                          |

### All types (`ItemType` model)

| Field      | Notes                                                              |
| ---------- | ------------------------------------------------------------------ |
| `name`     | lowercase key; `@@unique([name, userId])`                          |
| `icon`     | Lucide icon name as a string (e.g. `"Code"`)                       |
| `color`    | hex string                                                         |
| `isSystem` | `true` for the 7 built-in types                                    |
| `userId`   | `null` for system types; set for custom types (future, Pro)        |

The seed (`seedSystemTypes()`) finds each system type with `findFirst({ name, userId: null })` and then updates or creates it, because a compound unique `where` can't match a null `userId`. Since PostgreSQL treats nulls as distinct, `@@unique([name, userId])` does **not** stop two system types with the same name.

---

## Display differences

All type styling comes from the `ITEM_TYPE_DISPLAY` map in `src/lib/item-type-display.ts`. It holds static Tailwind classes per type so Tailwind can pick them up at build time:

| Key           | Example (snippet)        | Used for                                                          |
| ------------- | ------------------------ | ----------------------------------------------------------------- |
| `icon`        | `Code`                   | Lucide component                                                  |
| `textColor`   | `text-[#3b82f6]`         | icon color (sidebar, cards, profile)                              |
| `bgColor`     | `bg-[#3b82f6]`           | solid dot next to recent collections in the sidebar               |
| `borderColor` | `border-l-[#3b82f6]`     | 4px left border on item and collection cards                      |
| `bgTint`      | `bg-[#3b82f6]/10`        | icon tile on item cards, collection card background, profile tiles |

`getItemTypeDisplay(name)` returns a neutral fallback (`File` icon, muted colors) for unknown names or `null`. Custom types would get this fallback until the UI reads icon and color from the database.

**The `icon` and `color` columns in the database are not read by the UI.** The map above copies the seed values by hand, so changing a system type's color in the database has no visible effect, and the two can drift apart.

### Where types appear

- **Sidebar "Types"** (`SidebarTypes.tsx`): icon in the type color, plural label, the user's item count, and a "PRO" badge on File and Image (hidden when the sidebar is collapsed to icons).
- **Item cards** (`ItemCard.tsx`): left border in the type color, tinted icon tile, title, pin and favorite markers, description, tags, and the date (last used or created). **Every type renders the same way** right now. The card query (`ITEM_SUMMARY_SELECT`) doesn't load `content`, `language`, `url` or the file fields, so there are no code previews, link hostnames or file sizes yet.
- **Collection cards** (`CollectionCard.tsx`): border and background tint from the collection's most-used type (falling back to `defaultType`), plus a row of icons for every type the collection contains.
- **Profile "Items by type"** (`ProfileStats.tsx`): a tile per type with its tinted icon and count.

### Display notes from the spec (not built yet)

- Items open in a quick-access drawer for viewing and editing.
- TEXT types: Markdown editor and syntax highlighting (using `language`).
- FILE types: upload directly from the browser to R2 with presigned URLs; size limits per plan.
- Planned AI features per type: Explain This Code (snippets), Prompt Optimizer (prompts), plus auto-tagging and summaries for all types.

---

## Seed coverage

| Type    | Seeded items | Collections                                  |
| ------- | :----------: | -------------------------------------------- |
| Snippet | 4            | React Patterns (3), DevOps (1)               |
| Prompt  | 3            | AI Workflows                                 |
| Command | 5            | Terminal Commands (4), DevOps (1)            |
| Link    | 6            | Design Resources (4), DevOps (2)             |
| Note    | 0            | —                                            |
| File    | 0            | —                                            |
| Image   | 0            | —                                            |
| **Total** | **18**     | 5 collections                                |

`SeedTypeName` in `prisma/seed-data.ts` only allows `snippet | prompt | command | link`, so the seed can't create notes, files or images without changing that type.
