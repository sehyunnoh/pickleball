"use client";

import { useProgress } from "@/lib/progress";

/**
 * The "I can do this one" mark on a technique page.
 *
 * It says where the mark is stored, every time. There is no account behind it
 * and a reader clearing their browser loses it, so promising more than the
 * feature delivers would be a lie told in a checkbox.
 */
export default function ProgressToggle({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const { learned, toggle } = useProgress();
  const on = learned.has(slug);

  return (
    <div className="border-y border-border py-4">
      <button
        type="button"
        onClick={() => toggle(slug)}
        aria-pressed={on}
        className="group flex cursor-pointer items-center gap-3 text-left"
      >
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
            on
              ? "border-accent bg-accent text-bg"
              : "border-control group-hover:border-accent"
          }`}
        >
          {on ? "✓" : ""}
        </span>
        <span className="label">
          {on ? `${name} — learned` : `Mark ${name} as learned`}
        </span>
      </button>
      <p className="mt-2 pl-8 text-sm text-muted">
        Saved on this device only. There are no accounts here, so clearing your
        browser clears this.
      </p>
    </div>
  );
}
