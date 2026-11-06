"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useTransition } from "react";

import { generateDescription } from "@/actions/ai";
import { AiOnly } from "@/components/ai/AiAccessProvider";
import { Button } from "@/components/ui/button";
import { hasDescriptionSource, type DescriptionSource } from "@/lib/ai-description";
import { runItemAction } from "@/lib/run-item-action";

const LABEL = "Generate description with AI";

interface GenerateDescriptionButtonProps {
  // What the form holds right now, saved or not.
  source: DescriptionSource;
  onGenerated: (description: string) => void;
}

export function GenerateDescriptionButton(props: GenerateDescriptionButtonProps) {
  return (
    <AiOnly>
      <GenerateButton {...props} />
    </AiOnly>
  );
}

function GenerateButton({ source, onGenerated }: GenerateDescriptionButtonProps) {
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const result = await runItemAction(() => generateDescription(source));
      if (result) onGenerated(result.description);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      aria-label={LABEL}
      aria-busy={pending}
      onClick={generate}
      disabled={pending || !hasDescriptionSource(source)}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Generate Description
    </Button>
  );
}
