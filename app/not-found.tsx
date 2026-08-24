import Link from "next/link";
import { getTechniques } from "@/lib/content";

/**
 * 404.
 *
 * Most arrivals here are a mistyped or stale technique URL, so the page hands
 * over the ways back in rather than apologising: search, the full index, and
 * a few shots to click. Every route on this site is prerendered, so a 404 is
 * always a wrong address rather than something briefly unavailable.
 */
export default function NotFound() {
  const suggestions = getTechniques().slice(0, 4);

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-20 md:py-28">
      <p className="label text-muted">404</p>

      <h1 className="font-display mt-4 max-w-[16ch] text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] font-medium">
        There is no page here.
      </h1>

      <p className="mt-6 max-w-[52ch] leading-relaxed text-muted">
        The address is wrong, or it pointed at a technique that has not been
        written yet. Press{" "}
        <kbd className="label border border-border px-1.5 py-0.5">⌘K</kbd> to
        search, or start from the index.
      </p>

      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
        <Link
          href="/techniques"
          className="label border-b-2 border-accent pb-1 text-accent"
        >
          Every shot
        </Link>
        <Link
          href="/glossary"
          className="label border-b-2 border-transparent pb-1 text-muted hover:border-border hover:text-text"
        >
          Glossary
        </Link>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-16" aria-labelledby="suggestions">
          <h2
            id="suggestions"
            className="label border-b border-rule pb-3 text-muted"
          >
            Or try one of these
          </h2>
          <ul className="mt-4">
            {suggestions.map((t) => (
              <li key={t.slug} className="border-b border-border py-4">
                <Link
                  href={`/techniques/${t.slug}`}
                  className="font-display text-xl hover:text-accent"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
