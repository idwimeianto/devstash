"use client";

import { createContext, use, useCallback, useMemo, useRef, useState } from "react";

import { ItemDrawer, type ItemDrawerState } from "@/components/items/ItemDrawer";
import type { ItemDetailJson, ItemDetailResponse } from "@/types/items";

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

interface ItemDrawerContextValue {
  openItem: (itemId: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const context = use(ItemDrawerContext);
  if (!context) throw new Error("useItemDrawer must be used within ItemDrawerProvider");
  return context;
}

async function fetchItem(itemId: string): Promise<ItemDrawerState> {
  try {
    const response = await fetch(`/api/items/${encodeURIComponent(itemId)}`);
    const body: ItemDetailResponse = await response.json();
    return body.success
      ? { status: "loaded", item: body.data }
      : { status: "error", itemId, error: body.error };
  } catch {
    return { status: "error", itemId, error: NETWORK_ERROR };
  }
}

interface ItemDrawerProviderProps {
  children: React.ReactNode;
}

// Pages are server components, so the drawer's state lives here and cards open it by id.
export function ItemDrawerProvider({ children }: ItemDrawerProviderProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ItemDrawerState>({ status: "loading" });
  // Only the latest click may fill the drawer, so a slow earlier response can't replace it.
  const latestRequest = useRef(0);

  const openItem = useCallback(async (itemId: string) => {
    const request = ++latestRequest.current;
    setOpen(true);
    setState({ status: "loading" });
    const next = await fetchItem(itemId);
    if (request === latestRequest.current) setState(next);
  }, []);

  // A save returns the updated item, so the drawer shows it without fetching again.
  const showItem = useCallback(
    (item: ItemDetailJson) => setState({ status: "loaded", item }),
    [],
  );

  const closeDrawer = useCallback(() => setOpen(false), []);

  const context = useMemo(() => ({ openItem }), [openItem]);

  return (
    <ItemDrawerContext value={context}>
      {children}
      <ItemDrawer
        open={open}
        onOpenChange={setOpen}
        state={state}
        onRetry={openItem}
        onItemUpdated={showItem}
        onItemDeleted={closeDrawer}
      />
    </ItemDrawerContext>
  );
}
