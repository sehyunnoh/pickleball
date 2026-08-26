"use client";

import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FUSE_OPTIONS, type SearchRecord } from "@/lib/search";

/**
 * Site search, opened with the keyboard or the button in the header.
 *
 * A native <dialog> gives us the focus trap, the backdrop and Escape for free,
 * which is a lot of accessibility not to hand-roll.
 */
export default function SearchDialog({ index }: { index: SearchRecord[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const router = useRouter();

  // Built once. Fuse indexes on construction, and rebuilding it on every
  // keystroke is the usual way this component ends up feeling slow.
  const fuse = useMemo(() => new Fuse(index, FUSE_OPTIONS), [index]);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return fuse.search(trimmed, { limit: 8 }).map((r) => r.item);
  }, [fuse, query]);

  // Adjusting state during render rather than in an effect: the highlight is
  // derived from the query, and an effect would render the stale highlight
  // once before correcting it.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setHighlighted(0);
  }

  function open() {
    dialogRef.current?.showModal();
    // The autofocus lands before the dialog is painted otherwise.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function close() {
    dialogRef.current?.close();
    setQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
      // "/" is the other convention people try, but not while they are typing.
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === "/" && !typing && !dialogRef.current?.open) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(record: SearchRecord) {
    close();
    router.push(record.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[highlighted]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        // Wraps to two lines at 320px otherwise, which quietly makes the
        // sticky header taller on exactly the phones with least room.
        className="label cursor-pointer whitespace-nowrap text-muted hover:text-accent"
      >
        Search <span aria-hidden="true">⌘K</span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setQuery("")}
        aria-label="Search techniques and terms"
        className="m-0 w-full max-w-[38rem] border border-border bg-bg p-0 text-text backdrop:bg-black/40 sm:mt-[12vh] sm:mr-auto sm:ml-auto"
      >
        <div className="border-b border-border">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search a shot or a term…"
            aria-label="Search"
            className="w-full bg-transparent px-4 py-4 text-lg outline-none placeholder:text-muted"
          />
        </div>

        {query.trim().length >= 2 && (
          <ul className="max-h-[50vh] overflow-y-auto">
            {results.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted">
                Nothing found. Phase 1 covers technique and terminology only.
              </li>
            ) : (
              results.map((record, i) => (
                <li key={`${record.kind}-${record.slug}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => go(record)}
                    className={`w-full cursor-pointer border-b border-border px-4 py-3 text-left last:border-0 ${
                      i === highlighted ? "bg-accent-soft" : ""
                    }`}
                  >
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-display">{record.title}</span>
                      <span className="label text-muted">
                        {record.kind === "term" ? "term" : record.difficulty}
                      </span>
                    </span>
                    <span className="mt-1 line-clamp-1 text-sm text-muted">
                      {record.context}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        <p className="label border-t border-border px-4 py-2 text-muted">
          ↑↓ to move · ↵ to open · esc to close
        </p>
      </dialog>
    </>
  );
}
