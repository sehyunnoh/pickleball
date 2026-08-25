"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import TechniqueIndexView, { FACETS } from "./TechniqueIndexView";
import { useProgress } from "@/lib/progress";
import { type Technique } from "@/lib/schema";

/**
 * The live half of the technique index: filter state, and nothing else.
 *
 * Filtering happens in the browser over the full list, which is prerendered
 * into the page. Phase 1 tops out around thirty techniques, so this is cheaper
 * and faster than a round trip — and it keeps the route static, since reading
 * searchParams on the server would force it to render per request.
 *
 * Filter state lives in the URL so a filtered view can be sent to somebody.
 *
 * The markup lives in `TechniqueIndexView`, which the page also renders on the
 * server. `useSearchParams` opts this component out of static rendering; that
 * is fine for the controls but was not fine for the list, which is the page's
 * whole payload. See the note in that file.
 */
export default function TechniqueBrowser({
  techniques,
}: {
  techniques: Technique[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { learned } = useProgress();

  const active = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const facet of FACETS) out[facet.key] = params.get(facet.key);
    return out;
  }, [params]);

  const showLearned = params.get("learned");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  const clear = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [pathname, router],
  );

  const visible = techniques.filter((t) => {
    if (active.category && t.category !== active.category) return false;
    if (active.difficulty && t.difficulty !== active.difficulty) return false;
    if (active.zone && !t.courtZone.includes(active.zone as never))
      return false;
    if (active.situation && !t.situation.includes(active.situation as never)) {
      return false;
    }
    if (showLearned === "no" && learned.has(t.slug)) return false;
    if (showLearned === "yes" && !learned.has(t.slug)) return false;
    return true;
  });

  return (
    <TechniqueIndexView
      techniques={techniques}
      visible={visible}
      active={active}
      showLearned={showLearned}
      learned={learned}
      onFilter={setParam}
      onClear={clear}
    />
  );
}
