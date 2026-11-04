import type { ComponentProps } from "react";

// Simplified brand marks for the homepage hero; lucide no longer ships brand icons.
export function NotionIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="2.5" width="18" height="19" rx="3" />
      <path d="M8.5 17V7.5l7 9.5V7" />
    </svg>
  );
}

export function SlackIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="8" y="2" width="4" height="11" rx="2" fill="#36c5f0" />
      <rect x="11" y="8" width="11" height="4" rx="2" fill="#2eb67d" />
      <rect x="12" y="11" width="4" height="11" rx="2" fill="#ecb22e" />
      <rect x="2" y="12" width="11" height="4" rx="2" fill="#e01e5a" />
    </svg>
  );
}

export function VSCodeIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#2f80ed" d="M17.5 2.5 22 4.7v14.6l-4.5 2.2L8.3 13l-4 3.1L2 15V9l2.3-1.1 4 3.1Z" />
      <path fill="#1b5fbf" d="M17.5 7.6v8.8L11.6 12Z" />
    </svg>
  );
}
