import Link from "next/link";

/**
 * The mark on a clip nobody has watched.
 *
 * Most of these were chosen by matching a video's *title* against the
 * technique name. That is a real shortcut and the page has to own it: a site
 * whose pitch is hand-picked, timestamped clips cannot quietly mix in guesses
 * and let the reader assume otherwise.
 *
 * Deliberately plain — amber rule and small caps, no icon, no alarm. It is a
 * provenance note, not a warning about the video, and a clip that turns out to
 * be good simply loses the mark when somebody watches it.
 *
 * Colour is never doing the work on its own here (the site's rule for
 * difficulty applies just as well): the words say it too.
 */
export default function UnverifiedBadge({
  detailed = false,
}: {
  /** The hero gets the sentence; the grid captions get the two words. */
  detailed?: boolean;
}) {
  if (!detailed) {
    return (
      <span className="label text-[color:var(--difficulty-intermediate)]">
        Unverified
      </span>
    );
  }

  return (
    <p className="mt-3 border-l-2 border-[color:var(--difficulty-intermediate)] py-1 pl-3 text-sm text-muted">
      <span className="label mr-2 text-[color:var(--difficulty-intermediate)]">
        Unverified
      </span>
      Picked by matching the video title, and not yet watched — it may start
      somewhere other than the moment that shows the shot.{" "}
      <Link
        href="/about#the-videos"
        className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
      >
        Why
      </Link>
      .
    </p>
  );
}
