"use client";

import { useId, useMemo, useRef, useState } from "react";
import LiteYouTube from "./LiteYouTube";
import UnverifiedBadge from "./UnverifiedBadge";
import { formatSeconds } from "@/lib/format";
import {
  VIDEO_TYPES,
  VIDEO_TYPE_LABELS,
  type Video,
  type VideoType,
} from "@/lib/schema";

/**
 * The "Watch it" section: curated clips grouped by what they show.
 *
 * Tabs only list types that actually have clips — an empty "Drill" tab tells
 * the visitor nothing except that we did not finish our homework.
 */
export default function VideoGrid({ videos }: { videos: Video[] }) {
  const tabId = useId();

  const availableTypes = useMemo(
    () => VIDEO_TYPES.filter((t) => videos.some((v) => v.type === t)),
    [videos],
  );

  const [active, setActive] = useState<VideoType | "all">("all");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: (VideoType | "all")[] = ["all", ...availableTypes];
  const shown =
    active === "all" ? videos : videos.filter((v) => v.type === active);

  // Roving focus: a tablist is one tab stop, arrows move between tabs.
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    setActive(tabs[next]);
    tabRefs.current[next]?.focus();
  }

  if (videos.length === 0) {
    return (
      <p className="border-y border-border py-8 text-sm text-muted">
        No clips for this technique yet — not even an unwatched one, which means
        the search could not find anything that was plainly about it.
      </p>
    );
  }

  return (
    <div>
      {tabs.length > 2 && (
        <div
          role="tablist"
          aria-label="Filter clips by type"
          className="mb-6 flex flex-wrap gap-5"
        >
          {tabs.map((t, i) => {
            const selected = active === t;
            return (
              <button
                key={t}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`${tabId}-tab-${t}`}
                aria-selected={selected}
                aria-controls={`${tabId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(t)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`label cursor-pointer border-b-2 pb-1 transition-colors ${
                  selected
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-accent"
                }`}
              >
                {t === "all" ? "All" : VIDEO_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      )}

      <div
        id={`${tabId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabId}-tab-${active}`}
        className="grid gap-x-10 gap-y-8 sm:grid-cols-2"
      >
        {shown.map((v) => (
          <figure key={v.youtubeId} className="min-w-0">
            <LiteYouTube
              youtubeId={v.youtubeId}
              title={v.title}
              start={v.start}
              end={v.end}
            />
            <figcaption className="mt-3 text-sm">
              <span className="block leading-snug">{v.title}</span>
              <span className="label mt-1.5 block text-muted">
                {v.channel}
                {" · "}
                {VIDEO_TYPE_LABELS[v.type]}
                {" · "}
                {clipLabel(v)}
              </span>
              {v.verified === false && (
                <span className="mt-1.5 block">
                  <UnverifiedBadge />
                </span>
              )}
              {v.note && (
                <span className="mt-2 block text-muted italic">{v.note}</span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function clipLabel(v: Video): string {
  if (v.end !== undefined) {
    return `${formatSeconds(v.start)}–${formatSeconds(v.end)} (${v.end - v.start}s clip)`;
  }
  return v.start > 0 ? `from ${formatSeconds(v.start)}` : "full video";
}
