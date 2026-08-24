"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * "I can do this one" marks, kept in localStorage.
 *
 * There is no account system in Phase 1 and there will not be one until Phase
 * 7, so this is genuinely device-local — every surface that shows it has to
 * say so. It exists because it is the only reason to come back to the site
 * twice (DEVELOPMENT_PLAN.md §7).
 *
 * Modelled as an external store rather than component state: localStorage *is*
 * an external store, several components read it at once, and the server has no
 * view of it at all. `useSyncExternalStore` is built for exactly that shape —
 * it renders the server snapshot (nothing learned) during hydration and swaps
 * in the real value immediately after, with no effect and no cascading render.
 *
 * Every access is wrapped: localStorage throws outright in some private
 * browsing modes rather than returning null, and a saved checkbox is not worth
 * a blank page.
 */

const KEY = "pickleball:progress:v1";

/** Broadcast within the tab; the `storage` event only fires in *other* tabs. */
const EVENT = "pickleball:progress-changed";

const EMPTY: ReadonlySet<string> = new Set();

function read(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((s): s is string => typeof s === "string"))
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(slugs: ReadonlySet<string>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...slugs]));
  } catch {
    // Full, blocked, or private mode. The toggle still works for this session.
  }
}

// getSnapshot has to return the same reference until something actually
// changes, or React re-renders forever.
let cache: ReadonlySet<string> | null = null;
const listeners = new Set<() => void>();

function invalidate(): void {
  cache = null;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", invalidate);
  window.addEventListener(EVENT, invalidate);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", invalidate);
    window.removeEventListener(EVENT, invalidate);
  };
}

function getSnapshot(): ReadonlySet<string> {
  cache ??= read();
  return cache;
}

function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

export function useProgress() {
  const learned = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback((slug: string) => {
    const next = new Set(read());
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    write(next);
    cache = next;
    for (const listener of listeners) listener();
    // Other components mounted in this tab subscribe through the same store,
    // but a second tab only hears about it through `storage`, which fires on
    // its own.
  }, []);

  return { learned, toggle };
}
