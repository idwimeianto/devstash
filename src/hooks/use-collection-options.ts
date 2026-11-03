import { useEffect, useState } from "react";

import { getCollectionOptions } from "@/actions/collections";
import { NETWORK_ERROR } from "@/lib/messages";
import type { CollectionOption } from "@/types/collections";

type CollectionOptionsState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; options: CollectionOption[] };

// The signed-in user's collections, loaded when the form mounts so the list is always fresh.
export function useCollectionOptions() {
  const [state, setState] = useState<CollectionOptionsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    getCollectionOptions()
      .then((result) => {
        if (ignore) return;
        setState(
          result.success
            ? { status: "ready", options: result.data }
            : { status: "error", error: result.error },
        );
      })
      .catch(() => {
        if (!ignore) setState({ status: "error", error: NETWORK_ERROR });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((previous) => previous + 1);
  }

  return { state, retry };
}
