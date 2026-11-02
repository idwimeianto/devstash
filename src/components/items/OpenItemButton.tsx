"use client";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";

interface OpenItemButtonProps {
  itemId: string;
  title: string;
}

// Covers the whole card so the card can stay a server component.
export function OpenItemButton({ itemId, title }: OpenItemButtonProps) {
  const { openItem } = useItemDrawer();

  return (
    <button
      type="button"
      onClick={() => openItem(itemId)}
      className="absolute inset-0 z-10 cursor-pointer outline-none"
    >
      <span className="sr-only">Open {title}</span>
    </button>
  );
}
