// Sample data for prisma/seed.ts. See context/features/seed-spec.md.

export const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

export const BCRYPT_ROUNDS = 12;

export const SYSTEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
];

export type SeedTypeName = "snippet" | "prompt" | "command" | "link";

export interface SeedItem {
  type: SeedTypeName;
  title: string;
  description: string;
  content?: string;
  language?: string;
  url?: string;
  isPinned?: boolean;
}

export interface SeedCollection {
  name: string;
  description: string;
  defaultType: SeedTypeName;
  isFavorite?: boolean;
  items: SeedItem[];
}

const USE_DEBOUNCE = `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`;

const COMPOUND_TABS = `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used inside <Tabs>");
  return context;
}

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Trigger = function TabsTrigger({ id, children }: { id: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button aria-selected={active === id} onClick={() => setActive(id)}>
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ id, children }: { id: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === id ? <div>{children}</div> : null;
};`;

const UTILS = `export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return \`\${(bytes / 1024 ** i).toFixed(decimals)} \${units[i]}\`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/[\\s-]+/g, "-");
}

export function groupBy<T, K extends PropertyKey>(items: T[], getKey: (item: T) => K) {
  return items.reduce(
    (groups, item) => {
      (groups[getKey(item)] ??= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}`;

const CODE_REVIEW_PROMPT = `You are a senior software engineer reviewing a pull request.

Review the code below for:
1. Bugs and edge cases (null values, empty input, off-by-one errors)
2. Security issues (input validation, auth checks, secrets in code)
3. Performance problems (unnecessary re-renders, N+1 queries)
4. Readability and naming

For each issue, quote the line, explain the problem in one sentence and suggest a fix.
List the most severe issues first. If the code looks good, say so briefly.

\`\`\`
{{code}}
\`\`\``;

const DOCS_PROMPT = `Write documentation for the code below.

Include:
- A one-paragraph summary of what it does and when to use it
- Parameters and return value, with types
- A short usage example
- Any side effects, thrown errors or gotchas

Use Markdown. Keep it concise and aimed at developers new to this codebase.

\`\`\`
{{code}}
\`\`\``;

const REFACTOR_PROMPT = `Refactor the code below for readability and maintainability.

Rules:
- Keep the behavior exactly the same
- Prefer small, well-named functions
- Remove duplication and dead code
- Keep the existing language, framework and style conventions

Return the refactored code first, then a bullet list explaining each change in one line.

\`\`\`
{{code}}
\`\`\``;

const DOCKERFILE = `# Multi-stage build for a Next.js app
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]`;

const DEPLOY_COMMAND = `npm ci && npx prisma migrate deploy && npm run build && npm run start`;

export const SEED_COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    defaultType: "snippet",
    isFavorite: true,
    items: [
      {
        type: "snippet",
        title: "useDebounce & useLocalStorage Hooks",
        description: "Debounce a value and persist state to localStorage",
        content: USE_DEBOUNCE,
        language: "typescript",
        isPinned: true,
      },
      {
        type: "snippet",
        title: "Compound Tabs Component",
        description: "Context provider with compound Trigger and Panel components",
        content: COMPOUND_TABS,
        language: "typescript",
      },
      {
        type: "snippet",
        title: "Everyday Utility Functions",
        description: "formatBytes, slugify and a typed groupBy",
        content: UTILS,
        language: "typescript",
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    defaultType: "prompt",
    isFavorite: true,
    items: [
      {
        type: "prompt",
        title: "Code Review",
        description: "Thorough PR review covering bugs, security and performance",
        content: CODE_REVIEW_PROMPT,
        isPinned: true,
      },
      {
        type: "prompt",
        title: "Generate Documentation",
        description: "Turn a function or module into developer docs",
        content: DOCS_PROMPT,
      },
      {
        type: "prompt",
        title: "Refactoring Assistant",
        description: "Refactor for readability without changing behavior",
        content: REFACTOR_PROMPT,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    defaultType: "snippet",
    items: [
      {
        type: "snippet",
        title: "Next.js Dockerfile",
        description: "Multi-stage Docker build for a standalone Next.js app",
        content: DOCKERFILE,
        language: "dockerfile",
      },
      {
        type: "command",
        title: "Production Deploy",
        description: "Install, run migrations, build and start",
        content: DEPLOY_COMMAND,
        language: "bash",
      },
      {
        type: "link",
        title: "Docker Docs",
        description: "Official Docker documentation",
        url: "https://docs.docker.com/",
      },
      {
        type: "link",
        title: "GitHub Actions Docs",
        description: "Workflows, runners and CI/CD with GitHub Actions",
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    defaultType: "command",
    items: [
      {
        type: "command",
        title: "Undo Last Commit",
        description: "Undo the last commit but keep the changes staged",
        content: "git reset --soft HEAD~1",
        language: "bash",
      },
      {
        type: "command",
        title: "Docker Cleanup",
        description: "Remove stopped containers, unused images, networks and build cache",
        content: "docker system prune -a --volumes",
        language: "bash",
      },
      {
        type: "command",
        title: "Kill Process on Port",
        description: "Find and stop whatever is listening on port 3000",
        content: "lsof -ti :3000 | xargs kill -9",
        language: "bash",
      },
      {
        type: "command",
        title: "Find Outdated Packages",
        description: "List outdated npm dependencies and update within semver ranges",
        content: "npm outdated && npm update",
        language: "bash",
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    defaultType: "link",
    items: [
      {
        type: "link",
        title: "Tailwind CSS Docs",
        description: "Utility classes, theming and configuration reference",
        url: "https://tailwindcss.com/docs",
      },
      {
        type: "link",
        title: "shadcn/ui",
        description: "Accessible components you copy into your project",
        url: "https://ui.shadcn.com/",
      },
      {
        type: "link",
        title: "Material Design 3",
        description: "Google's open-source design system",
        url: "https://m3.material.io/",
      },
      {
        type: "link",
        title: "Lucide Icons",
        description: "Open-source icon library with React components",
        url: "https://lucide.dev/icons/",
      },
    ],
  },
];
