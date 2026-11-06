"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { useCanUseAi } from "@/components/ai/AiAccessProvider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PRO_TOOLTIP = "AI features require Pro subscription";
// The ::after makes the 24px button a 32px tap target without changing how it looks.
const TAP_TARGET_CLASSES = "relative after:absolute after:-inset-y-1";

interface AiActionButtonProps {
  label: string;
  ariaLabel: string;
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
}

// An editor header's AI button. Hidden until the plan is known, so free users never see the
// wrong icon first.
export function AiActionButton(props: AiActionButtonProps) {
  return (
    <Suspense fallback={null}>
      <AiActionButtonForPlan {...props} />
    </Suspense>
  );
}

function AiActionButtonForPlan({
  label,
  ariaLabel,
  pending,
  disabled = false,
  onClick,
}: AiActionButtonProps) {
  const canUseAi = useCanUseAi();

  if (canUseAi) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className={TAP_TARGET_CLASSES}
        aria-label={ariaLabel}
        aria-busy={pending}
        disabled={pending || disabled}
        onClick={onClick}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {label}
      </Button>
    );
  }

  // Clicking still asks the server, which answers free users with the upgrade toast.
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className={TAP_TARGET_CLASSES}
            aria-label={`${ariaLabel}. ${PRO_TOOLTIP}`}
            aria-busy={pending}
            disabled={pending || disabled}
            onClick={onClick}
          />
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Crown />}
        {label}
      </TooltipTrigger>
      <TooltipContent>{PRO_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
}

interface AiTabButtonProps {
  // The tab's and panel's element ids are built from these.
  id: string;
  tab: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function AiTabButton({ id, tab, label, selected, onSelect }: AiTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={`${id}-${tab}-tab`}
      aria-selected={selected}
      aria-controls={selected ? `${id}-${tab}-panel` : undefined}
      onClick={onSelect}
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

interface AiTabListProps<T extends string> {
  // Shared with AiTabPanel, so each tab and its panel point at each other.
  id: string;
  ariaLabel: string;
  tabs: readonly { key: T; label: string }[];
  active: T;
  onSelect: (tab: T) => void;
}

export function AiTabList<T extends string>({
  id,
  ariaLabel,
  tabs,
  active,
  onSelect,
}: AiTabListProps<T>) {
  return (
    <div role="tablist" aria-label={`${ariaLabel} view`} className="flex shrink-0 gap-1">
      {tabs.map(({ key, label }) => (
        <AiTabButton
          key={key}
          id={id}
          tab={key}
          label={label}
          selected={active === key}
          onSelect={() => onSelect(key)}
        />
      ))}
    </div>
  );
}

interface AiTabPanelProps {
  id: string;
  tab: string;
  className?: string;
  children: ReactNode;
}

export function AiTabPanel({ id, tab, className, children }: AiTabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`${id}-${tab}-panel`}
      aria-labelledby={`${id}-${tab}-tab`}
      className={className}
    >
      {children}
    </div>
  );
}
