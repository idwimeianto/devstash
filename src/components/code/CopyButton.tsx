"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const COPIED_RESET_MS = 2000;

interface CopyButtonProps {
  value: string;
  label: string;
  className?: string;
}

// Copies the value with a toast, showing a check icon for 2s; disabled when there is nothing to copy.
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast.error("Couldn't copy to the clipboard");
      return;
    }
    toast.success("Copied to clipboard");
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      disabled={!value}
      aria-label={copied ? "Copied" : label}
      className={className}
    >
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
    </Button>
  );
}
