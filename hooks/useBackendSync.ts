"use client";
import { useEffect, useRef, useState } from "react";
import { api, type ApiUser } from "@/lib/api";
import { localHasExtra, mergeStores, normalize } from "@/lib/store";
import type { Store } from "@/lib/types";

export interface BackendSyncState {
  status: "idle" | "syncing" | "synced" | "error";
}

/**
 * Syncs the whole plan (meals, ingredients, bought, profile) with the recipe-ai-api
 * backend per account, so it follows the user across devices. Active only while
 * signed in to the backend; localStorage stays the always-available base.
 */
export function useBackendSync(
  store: Store,
  storeRef: React.MutableRefObject<Store>,
  applyingRemote: React.MutableRefObject<boolean>,
  applyRemote: (s: Store) => void,
  apiUser: ApiUser | null,
): BackendSyncState {
  const [status, setStatus] = useState<BackendSyncState["status"]>("idle");
  const pulledFor = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On sign-in: pull the account's plan and merge with the local one.
  useEffect(() => {
    if (!apiUser) {
      pulledFor.current = null;
      setStatus("idle");
      return;
    }
    if (pulledFor.current === apiUser.id) return;
    pulledFor.current = apiUser.id;

    let cancelled = false;
    setStatus("syncing");
    api
      .getPlan()
      .then(({ data }) => {
        if (cancelled) return;
        const local = storeRef.current;
        if (data) {
          const remote = normalize(data);
          const merged = mergeStores(local, remote);
          applyRemote(merged);
          if (localHasExtra(local, remote)) void api.putPlan(merged);
        } else {
          void api.putPlan(local); // first device — seed the cloud
        }
        setStatus("synced");
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, [apiUser, storeRef, applyRemote]);

  // On local change: debounced push.
  useEffect(() => {
    if (!apiUser || applyingRemote.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    setStatus("syncing");
    pushTimer.current = setTimeout(() => {
      api
        .putPlan(storeRef.current)
        .then(() => setStatus("synced"))
        .catch(() => setStatus("error"));
    }, 800);
  }, [store, apiUser, applyingRemote, storeRef]);

  return { status };
}
