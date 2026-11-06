"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { generateAutoTags } from "@/actions/ai";
import { AiOnly } from "@/components/ai/AiAccessProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addTag, getNewTags } from "@/lib/item-fields";
import { runItemAction } from "@/lib/run-item-action";

interface SuggestTagsProps {
  title: string;
  content: string;
  // The form's comma-separated tags text.
  tags: string;
  onTagsChange: (tags: string) => void;
}

export function SuggestTags(props: SuggestTagsProps) {
  return (
    <AiOnly>
      <SuggestTagsPanel {...props} />
    </AiOnly>
  );
}

function SuggestTagsPanel({ title, content, tags, onTagsChange }: SuggestTagsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  // A tag typed into the field by hand stops being suggested.
  const visible = getNewTags(suggestions, tags);

  function suggest() {
    startTransition(async () => {
      const result = await runItemAction(() => generateAutoTags({ title, content }));
      if (!result) return;
      setSuggestions(result.tags);
      if (getNewTags(result.tags, tags).length === 0) toast.info("No new tags to suggest");
    });
  }

  function dismiss(tag: string) {
    setSuggestions((current) => current.filter((suggestion) => suggestion !== tag));
  }

  return (
    <div className="grid justify-items-start gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={suggest}
        disabled={pending || !title.trim()}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Suggest Tags
      </Button>
      <ul aria-live="polite" aria-label="Suggested tags" className="flex flex-wrap gap-1.5">
        {visible.map((tag) => (
          <li key={tag}>
            <Badge variant="outline" className="h-7 gap-1 pr-1 pl-2.5">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Accept tag ${tag}`}
                onClick={() => {
                  onTagsChange(addTag(tags, tag));
                  dismiss(tag);
                }}
              >
                <Check />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Reject tag ${tag}`}
                onClick={() => dismiss(tag)}
              >
                <X />
              </Button>
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
