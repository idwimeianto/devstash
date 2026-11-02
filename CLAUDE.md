# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `npx tsc --noEmit` — type-check

No test framework is configured yet.

## Stack

Next.js 16.4 (App Router) with React 19.3, TypeScript (strict) and Tailwind CSS v4. The Next.js version is newer than most training data: check `node_modules/next/dist/docs/` before using any Next.js API.

## Neon Database (MCP)

When using the Neon MCP tools, always target:

- **Project:** `devstash` (ID: `lucky-firefly-14547892`)
- **Branch:** `development` (ID: `br-aged-leaf-az6mrmg3`)

Rules:

- Always pass `project_id` and `branch_id` explicitly on every Neon MCP call. Never rely on the default branch: the project's default is `production`, so leaving out `branch_id` hits production.
- **Never** read from or write to the `production` branch (ID: `br-empty-haze-az9lahzt`) unless I name it in that request. Permission to use production applies only to that one request.
- If a task looks like it needs production, stop and ask first.
- Destructive SQL (`DELETE`, `UPDATE`, `DROP`, `TRUNCATE`, `ALTER`) and destructive MCP tools (deleting or resetting branches, rotating credentials, etc.) need my confirmation, even on `development`.
- Schema changes go through Prisma migrations (`npx prisma migrate dev`), not raw SQL through the MCP.
