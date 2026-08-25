"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Analytics consent, kept in localStorage.
 *
 * GA4 sets cookies and processes personal data. The audience is global
 * English, which means EEA and UK visitors, which means consent has to be
 * taken *before* the tag fires — not defaulted to yes and withdrawn later
 * (REQUIREMENTS.md §16). So the answer is stored here, the tag is not rendered
 * at all until it reads "granted", and nobody is asked twice.
 *
 * Same shape as `lib/progress.ts` and for the same reason: localStorage is an
 * external store, two components read it at once, and the server cannot see
 * it. The server snapshot is "unknown" rather than "unset" so that a static
 * page never ships a banner baked into its HTML — the banner appears a beat
 * after hydration, once the real answer is known.
 */

export type Consent =
  /** Before hydration. Show nothing, load nothing. */
  | "unknown"
  /** Hydrated, never asked. This is what puts the banner on screen. */
  | "unset"
  | "granted"
  | "denied";

const KEY = "pickleball:consent:analytics:v1";

/** Broadcast within the tab; `storage` only fires in *other* tabs. */
const EVENT = "pickleball:consent-changed";

function read(): Consent {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "granted" || raw === "denied" ? raw : "unset";
  } catch {
    // Private mode can throw outright. Treat an unreadable store as an
    // unanswered question — which keeps analytics off, the safe direction.
    return "unset";
  }
}

function write(value: Consent): void {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Nothing to do. The choice holds for this page view and is asked again
    // next time, which is the correct failure: never a silent yes.
  }
}

let cache: Consent | null = null;
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

function getSnapshot(): Consent {
  cache ??= read();
  return cache;
}

function getServerSnapshot(): Consent {
  return "unknown";
}

export function useConsent() {
  const consent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const decide = useCallback((value: "granted" | "denied") => {
    write(value);
    cache = value;
    invalidate();
  }, []);

  return { consent, decide };
}

/**
 * Whether there is anything to ask about. With no measurement ID configured
 * there is no tag, no cookie and no question — so no banner either. This is
 * the state every preview build and every `npm run dev` is in.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
