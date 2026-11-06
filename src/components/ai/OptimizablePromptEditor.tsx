"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { optimizePrompt } from "@/actions/ai";
import { updateItem } from "@/actions/items";
import { AiActionButton, AiTabButton } from "@/components/ai/AiHeaderControls";
import { MarkdownEditor, MarkdownPreview } from "@/components/markdown/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { runItemAction } from "@/lib/run-item-action";
import type { ItemDetailJson } from "@/types/items";

type PromptTab = "current" | "optimized";

interface Suggestion {
  optimized: string;
  changes: string[];
}

interface OptimizablePromptEditorProps {
  item: ItemDetailJson;
  value: string;
  ariaLabel: string;
  onSaved: (item: ItemDetailJson) => void;
}

// A read-only prompt with an AI rewrite shown beside it. Nothing is saved until the user chooses
// the rewrite, and clicking Optimize again asks for a new one.
export function OptimizablePromptEditor({
  item,
  value,
  ariaLabel,
  onSaved,
}: OptimizablePromptEditorProps) {
  const id = useId();
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [tab, setTab] = useState<PromptTab>("current");
  const [optimizing, startOptimizing] = useTransition();
  const [saving, startSaving] = useTransition();
  const showOptimized = suggestion !== null && tab === "optimized";

  function optimize() {
    startOptimizing(async () => {
      const result = await runItemAction(() => optimizePrompt({ content: value }));
      if (!result) return;
      if (result.optimized === null) {
        // An earlier suggestion stays on screen until the user decides on it.
        toast.info("This prompt already looks good. No changes suggested.");
        return;
      }
      setSuggestion({ optimized: result.optimized, changes: result.changes });
      setTab("optimized");
    });
  }

  function saveOptimized(optimized: string) {
    startSaving(async () => {
      // Only the content changes; the action requires these other fields, and its collections
      // stay as they are when left out.
      const { title, description, tags } = item;
      const updated = await runItemAction(
        () => updateItem(item.id, { title, description, tags, content: optimized }),
        { successMessage: "Prompt updated" },
      );
      if (!updated) return;
      setSuggestion(null);
      setTab("current");
      onSaved(updated);
      router.refresh();
    });
  }

  return (
    <MarkdownEditor
      value={value}
      readOnly
      ariaLabel={ariaLabel}
      copy={
        showOptimized
          ? { value: suggestion.optimized, label: "Copy optimized prompt" }
          : { value, label: "Copy content" }
      }
      headerTabs={
        suggestion ? (
          <div role="tablist" aria-label={`${ariaLabel} view`} className="flex shrink-0 gap-1">
            <AiTabButton
              id={id}
              tab="current"
              label="Current"
              selected={tab === "current"}
              onSelect={() => setTab("current")}
            />
            <AiTabButton
              id={id}
              tab="optimized"
              label="Optimized"
              selected={tab === "optimized"}
              onSelect={() => setTab("optimized")}
            />
          </div>
        ) : undefined
      }
      headerActions={
        <AiActionButton
          label="Optimize"
          ariaLabel="Optimize with AI"
          pending={optimizing}
          disabled={saving}
          onClick={optimize}
        />
      }
      renderBody={(current) =>
        suggestion === null ? (
          current
        ) : (
          <>
            <div role="tabpanel" id={`${id}-${tab}-panel`} aria-labelledby={`${id}-${tab}-tab`}>
              {showOptimized ? (
                <div className="max-h-[400px] overflow-auto px-4 py-3">
                  <MarkdownPreview value={suggestion.optimized} />
                </div>
              ) : (
                current
              )}
            </div>
            <SuggestionChoice
              changes={suggestion.changes}
              saving={saving}
              disabled={optimizing}
              onUse={() => saveOptimized(suggestion.optimized)}
              onKeep={() => {
                setSuggestion(null);
                setTab("current");
              }}
            />
          </>
        )
      }
    />
  );
}

interface SuggestionChoiceProps {
  changes: string[];
  saving: boolean;
  disabled: boolean;
  onUse: () => void;
  onKeep: () => void;
}

// Outside the scrolling preview, so the choice stays visible on a long prompt.
function SuggestionChoice({ changes, saving, disabled, onUse, onKeep }: SuggestionChoiceProps) {
  return (
    <div className="grid gap-3 border-t bg-[#2d2d2d]/50 px-4 py-3">
      {changes.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm font-medium">Use the AI-optimized prompt?</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={saving || disabled}
          onClick={onKeep}
        >
          Keep current
        </Button>
        <Button type="button" size="sm" disabled={saving || disabled} onClick={onUse}>
          {saving && <Loader2 className="animate-spin" />}
          Use optimized
        </Button>
      </div>
    </div>
  );
}
