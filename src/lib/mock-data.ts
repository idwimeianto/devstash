// Temporary mock data for the dashboard UI. Shapes mirror the Prisma draft in
// context/project-overview.md so this can be swapped for real queries later.

export type ContentType = "TEXT" | "URL" | "FILE";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // hex
  isSystem: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  defaultTypeId: string | null;
  createdAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  content: string | null;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  url: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: string | null;
  typeId: string;
  collectionIds: string[];
  tags: string[];
  createdAt: string;
}

export const CURRENT_USER: User = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  image: null,
  isPro: false,
};

export const ITEM_TYPES: ItemType[] = [
  {
    id: "type_snippet",
    name: "snippet",
    icon: "Code",
    color: "#3b82f6",
    isSystem: true,
  },
  {
    id: "type_prompt",
    name: "prompt",
    icon: "Sparkles",
    color: "#8b5cf6",
    isSystem: true,
  },
  {
    id: "type_command",
    name: "command",
    icon: "Terminal",
    color: "#f97316",
    isSystem: true,
  },
  {
    id: "type_note",
    name: "note",
    icon: "StickyNote",
    color: "#fde047",
    isSystem: true,
  },
  {
    id: "type_file",
    name: "file",
    icon: "File",
    color: "#6b7280",
    isSystem: true,
  },
  {
    id: "type_image",
    name: "image",
    icon: "Image",
    color: "#ec4899",
    isSystem: true,
  },
  {
    id: "type_link",
    name: "link",
    icon: "Link",
    color: "#10b981",
    isSystem: true,
  },
];

export const COLLECTIONS: Collection[] = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    defaultTypeId: "type_snippet",
    createdAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    defaultTypeId: "type_snippet",
    createdAt: "2026-01-04T10:00:00.000Z",
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    defaultTypeId: "type_file",
    createdAt: "2026-01-05T10:00:00.000Z",
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    defaultTypeId: "type_note",
    createdAt: "2026-01-06T10:00:00.000Z",
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    defaultTypeId: "type_command",
    createdAt: "2026-01-07T10:00:00.000Z",
  },
  {
    id: "col_ai",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    defaultTypeId: "type_prompt",
    createdAt: "2026-01-08T10:00:00.000Z",
  },
];

const EMPTY_FIELDS = {
  content: null,
  language: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  url: null,
} as const;

export const ITEMS: Item[] = [
  {
    ...EMPTY_FIELDS,
    id: "item_use_auth",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "TEXT",
    content:
      'export function useAuth() {\n  const context = useContext(AuthContext);\n  if (!context) throw new Error("useAuth must be used within AuthProvider");\n  return context;\n}',
    language: "typescript",
    isFavorite: true,
    isPinned: true,
    lastUsedAt: "2026-01-15T09:30:00.000Z",
    typeId: "type_snippet",
    collectionIds: ["col_react", "col_interview"],
    tags: ["react", "auth", "hooks"],
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_api_error",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "TEXT",
    content:
      "async function fetchWithRetry(url: string, retries = 3): Promise<Response> {\n  for (let i = 0; i < retries; i++) {\n    const res = await fetch(url);\n    if (res.ok) return res;\n    await new Promise((r) => setTimeout(r, 2 ** i * 500));\n  }\n  throw new Error(`Failed after ${retries} retries`);\n}",
    language: "typescript",
    isFavorite: false,
    isPinned: true,
    lastUsedAt: "2026-01-12T14:00:00.000Z",
    typeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["fetch", "errors", "retry"],
    createdAt: "2026-01-12T13:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_use_debounce",
    title: "useDebounce Hook",
    description: "Debounce a value by a given delay",
    contentType: "TEXT",
    content:
      "export function useDebounce<T>(value: T, delay = 300) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(id);\n  }, [value, delay]);\n  return debounced;\n}",
    language: "typescript",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-14T08:00:00.000Z",
    typeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["react", "hooks"],
    createdAt: "2026-01-10T08:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_list_comp",
    title: "Dictionary Comprehension",
    description: "Build a dict from two lists",
    contentType: "TEXT",
    content: "result = {k: v for k, v in zip(keys, values)}",
    language: "python",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-11T16:00:00.000Z",
    typeId: "type_snippet",
    collectionIds: ["col_python"],
    tags: ["python", "dict"],
    createdAt: "2026-01-09T16:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_venv_note",
    title: "Virtualenv Setup",
    description: "Steps to set up a Python virtual environment",
    contentType: "TEXT",
    content:
      "1. `python -m venv .venv`\n2. Activate it\n3. `pip install -r requirements.txt`",
    language: "markdown",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_note",
    collectionIds: ["col_python"],
    tags: ["python", "setup"],
    createdAt: "2026-01-08T11:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_claude_md",
    title: "CLAUDE.md Template",
    description: "Base context file for new projects",
    contentType: "FILE",
    fileUrl: "/mock/claude-template.md",
    fileName: "CLAUDE.md",
    fileSize: 2048,
    isFavorite: true,
    isPinned: false,
    lastUsedAt: "2026-01-13T10:00:00.000Z",
    typeId: "type_file",
    collectionIds: ["col_context"],
    tags: ["ai", "context"],
    createdAt: "2026-01-07T10:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_context_note",
    title: "Context File Guidelines",
    description: "What to include in AI context files",
    contentType: "TEXT",
    content:
      "- Project overview\n- Coding standards\n- Current feature\n- Workflow rules",
    language: "markdown",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_note",
    collectionIds: ["col_context", "col_ai"],
    tags: ["ai", "docs"],
    createdAt: "2026-01-07T12:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_big_o",
    title: "Big-O Cheat Sheet",
    description: "Time complexity of common data structures",
    contentType: "TEXT",
    content:
      "| Structure | Access | Search | Insert |\n| --- | --- | --- | --- |\n| Array | O(1) | O(n) | O(n) |\n| Hash map | — | O(1) | O(1) |",
    language: "markdown",
    isFavorite: true,
    isPinned: false,
    lastUsedAt: "2026-01-10T19:00:00.000Z",
    typeId: "type_note",
    collectionIds: ["col_interview"],
    tags: ["algorithms", "interview"],
    createdAt: "2026-01-06T19:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_system_design",
    title: "System Design Primer",
    description: "Open-source guide to large-scale system design",
    contentType: "URL",
    url: "https://github.com/donnemartin/system-design-primer",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_link",
    collectionIds: ["col_interview"],
    tags: ["system-design", "interview"],
    createdAt: "2026-01-06T20:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_react_docs",
    title: "React Docs",
    description: "Official React documentation",
    contentType: "URL",
    url: "https://react.dev",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-09T09:00:00.000Z",
    typeId: "type_link",
    collectionIds: ["col_react"],
    tags: ["react", "docs"],
    createdAt: "2026-01-02T11:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_mock_interviewer",
    title: "Mock Interviewer",
    description: "Prompt the AI to run a technical mock interview",
    contentType: "TEXT",
    content:
      "Act as a senior engineer interviewing me for a frontend role. Ask one question at a time and give feedback after each answer.",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_prompt",
    collectionIds: ["col_interview", "col_ai"],
    tags: ["interview", "ai"],
    createdAt: "2026-01-06T21:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_git_undo",
    title: "Undo Last Commit",
    description: "Undo the last commit but keep the changes staged",
    contentType: "TEXT",
    content: "git reset --soft HEAD~1",
    language: "bash",
    isFavorite: true,
    isPinned: false,
    lastUsedAt: "2026-01-14T17:00:00.000Z",
    typeId: "type_command",
    collectionIds: ["col_git"],
    tags: ["git"],
    createdAt: "2026-01-07T13:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_git_branch_cleanup",
    title: "Delete Merged Branches",
    description: "Remove local branches already merged into main",
    contentType: "TEXT",
    content: 'git branch --merged main | grep -v "main" | xargs git branch -d',
    language: "bash",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_command",
    collectionIds: ["col_git"],
    tags: ["git", "cleanup"],
    createdAt: "2026-01-07T14:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_git_workflow",
    title: "Branching Workflow",
    description: "Team conventions for feature branches",
    contentType: "TEXT",
    content:
      "Name branches `feature/<name>` or `fix/<name>`. Squash-merge into main and delete the branch afterwards.",
    language: "markdown",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_note",
    collectionIds: ["col_git"],
    tags: ["git", "workflow"],
    createdAt: "2026-01-07T15:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_refactor_prompt",
    title: "Refactor for Readability",
    description: "Ask the AI to refactor code without changing behavior",
    contentType: "TEXT",
    content:
      "Refactor the following code for readability. Keep behavior identical, explain each change briefly:\n\n{{code}}",
    isFavorite: true,
    isPinned: false,
    lastUsedAt: "2026-01-15T11:00:00.000Z",
    typeId: "type_prompt",
    collectionIds: ["col_ai"],
    tags: ["ai", "refactor"],
    createdAt: "2026-01-08T09:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_test_prompt",
    title: "Write Unit Tests",
    description: "Generate unit tests covering edge cases",
    contentType: "TEXT",
    content:
      "Write unit tests for the following function. Cover happy paths, edge cases and error handling:\n\n{{code}}",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_prompt",
    collectionIds: ["col_ai"],
    tags: ["ai", "testing"],
    createdAt: "2026-01-08T10:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_type_guard",
    title: "TypeScript Type Guard",
    description: "Narrow unknown values safely",
    contentType: "TEXT",
    content:
      'function isString(value: unknown): value is string {\n  return typeof value === "string";\n}',
    language: "typescript",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_snippet",
    collectionIds: ["col_ai"],
    tags: ["typescript"],
    createdAt: "2026-01-08T12:00:00.000Z",
  },
  {
    ...EMPTY_FIELDS,
    id: "item_architecture_diagram",
    title: "Architecture Diagram",
    description: "High-level system architecture",
    contentType: "FILE",
    fileUrl: "/mock/architecture.png",
    fileName: "architecture.png",
    fileSize: 184320,
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    typeId: "type_image",
    collectionIds: ["col_context"],
    tags: ["architecture"],
    createdAt: "2026-01-05T15:00:00.000Z",
  },
];
