"use client";

import { GA_ID, useConsent } from "@/lib/consent";

/**
 * Withdrawing consent has to be as easy as giving it, so the answer is not
 * only editable here, it is editable in the same two presses the banner used.
 * Lives on /privacy, which is where the banner and the footer both point.
 */
export default function ConsentControl() {
  const { consent, decide } = useConsent();

  if (!GA_ID) {
    return (
      <p className="text-muted">
        Analytics is not switched on for this deployment at all, so there is
        nothing here to decide yet.
      </p>
    );
  }

  if (consent === "unknown") {
    // Pre-hydration. Rendering "you have not been asked" here and swapping it
    // a moment later would be worse than a beat of nothing.
    return <p className="text-muted">Checking what you chose…</p>;
  }

  return (
    <div className="border-y border-border py-4">
      <p className="text-sm">
        {consent === "granted"
          ? "Right now: analytics is on. Google Analytics loads on this device and sets a cookie."
          : consent === "denied"
            ? "Right now: analytics is off. Nothing is loaded and no cookie is set."
            : "You have not been asked yet — the bar at the foot of the page is waiting for an answer."}
      </p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => decide("denied")}
          aria-pressed={consent === "denied"}
          className={`label cursor-pointer border px-4 py-2 ${
            consent === "denied"
              ? "border-accent text-accent"
              : "border-control hover:border-accent hover:text-accent"
          }`}
        >
          Keep it off
        </button>
        <button
          type="button"
          onClick={() => decide("granted")}
          aria-pressed={consent === "granted"}
          className={`label cursor-pointer border px-4 py-2 ${
            consent === "granted"
              ? "border-accent text-accent"
              : "border-control hover:border-accent hover:text-accent"
          }`}
        >
          Turn it on
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">
        Your answer is stored in this browser, not on a server. Switching it off
        stops the script loading on the next page you open; the cookie Google
        already set is cleared when you clear your browser.
      </p>
    </div>
  );
}
