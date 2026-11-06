"use client";

import { useId, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { CopyButton } from "@/components/code/CopyButton";
import { getSafeHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

type MarkdownTab = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  ariaLabel: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  // Extras for a read-only header: tabs replacing the Preview label and actions before copy.
  headerTabs?: ReactNode;
  headerActions?: ReactNode;
  // What the copy button copies, when the body shows something other than the value.
  copy?: { value: string; label: string };
  // Wraps or replaces the content below the header.
  renderBody?: (content: ReactNode) => ReactNode;
}

export function MarkdownEditor({
  value,
  readOnly = false,
  ariaLabel,
  onChange,
  invalid = false,
  describedBy,
  className,
  headerTabs,
  headerActions,
  copy = { value, label: "Copy content" },
  renderBody = (content) => content,
}: MarkdownEditorProps) {
  const id = useId();
  // Read-only editors only ever show the preview.
  const [tab, setTab] = useState<MarkdownTab>(readOnly ? "preview" : "write");
  const activeTab = readOnly ? "preview" : tab;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-[#1e1e1e]",
        !readOnly && "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive",
        className,
      )}
    >
      <div className="flex h-9 items-center gap-1 border-b bg-[#2d2d2d] px-2">
        {readOnly ? (
          (headerTabs ?? (
            <span className="px-2 text-xs font-medium text-muted-foreground">Preview</span>
          ))
        ) : (
          <div role="tablist" aria-label={`${ariaLabel} mode`} className="flex gap-1">
            <MarkdownTabButton id={id} tab="write" active={activeTab} onSelect={setTab} />
            <MarkdownTabButton id={id} tab="preview" active={activeTab} onSelect={setTab} />
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          {headerActions}
          <CopyButton value={copy.value} label={copy.label} />
        </div>
      </div>
      {renderBody(
        activeTab === "write" ? (
          <textarea
            id={`${id}-write-panel`}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder="Write in Markdown…"
            spellCheck={false}
            className="block field-sizing-content max-h-[400px] min-h-[120px] w-full resize-none bg-transparent px-4 py-3 font-mono text-base leading-relaxed outline-none md:text-sm placeholder:text-muted-foreground"
          />
        ) : (
          <div
            id={`${id}-preview-panel`}
            role={readOnly ? undefined : "tabpanel"}
            aria-labelledby={readOnly ? undefined : `${id}-preview-tab`}
            aria-label={readOnly ? ariaLabel : undefined}
            className={cn("max-h-[400px] overflow-auto px-4 py-3", !readOnly && "min-h-[120px]")}
          >
            <MarkdownPreview value={value} />
          </div>
        ),
      )}
    </div>
  );
}

const TAB_LABELS: Record<MarkdownTab, string> = { write: "Write", preview: "Preview" };

interface MarkdownTabButtonProps {
  id: string;
  tab: MarkdownTab;
  active: MarkdownTab;
  onSelect: (tab: MarkdownTab) => void;
}

function MarkdownTabButton({ id, tab, active, onSelect }: MarkdownTabButtonProps) {
  const selected = tab === active;

  return (
    <button
      type="button"
      role="tab"
      id={`${id}-${tab}-tab`}
      aria-selected={selected}
      aria-controls={`${id}-${tab}-panel`}
      onClick={() => onSelect(tab)}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "bg-[#1e1e1e] text-foreground"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      {TAB_LABELS[tab]}
    </button>
  );
}

// Content is user input: raw HTML isn't rendered, and only http(s) links and images are kept.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => {
    const safeHref = href ? getSafeHref(href) : null;
    if (!safeHref) return <span>{children}</span>;
    return (
      <a href={safeHref} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => {
    const safeSrc = typeof src === "string" ? getSafeHref(src) : null;
    if (!safeSrc) return null;
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote images from user content
    return <img src={safeSrc} alt={alt ?? ""} loading="lazy" />;
  },
};

export function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return <p className="text-sm text-muted-foreground">Nothing to preview</p>;
  }

  return (
    <div className="markdown-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {value}
      </ReactMarkdown>
    </div>
  );
}
