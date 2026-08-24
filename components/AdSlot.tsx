/**
 * A reserved position for a display ad. Renders nothing until ads are switched
 * on, which will not be until after launch (DEVELOPMENT_PLAN.md §10).
 *
 * The point of having it now is that the two placements are *decided* and live
 * in the layout, so turning ads on later does not mean re-cutting the spacing
 * rhythm around them. Both sit at a natural break in the reading — after the
 * mistakes and before the clips — rather than interrupting an explanation.
 *
 * The height is reserved by the container rather than by whatever Google
 * returns. An ad that arrives and pushes the article down is a layout shift,
 * and CLS is a third of the Lighthouse performance score this project has
 * committed to (REQUIREMENTS.md §11).
 *
 * A sidebar placement was considered and rejected: the left column is the
 * metadata rail, and squeezing an ad in beside 66 characters of body text
 * would wreck the measure.
 */

export type AdPlacement = "after-mistakes" | "before-clips";

/** Reserved box heights, in px. Sized for a responsive in-article unit. */
const RESERVED_HEIGHT = "min-h-[280px] sm:min-h-[250px]";

export default function AdSlot({ placement }: { placement: AdPlacement }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;

  return (
    <aside
      aria-label="Advertisement"
      data-placement={placement}
      className={`my-12 flex ${RESERVED_HEIGHT} flex-col items-center justify-center border-y border-border`}
    >
      <p className="label text-muted">Advertisement</p>
      {/*
        AdSense goes here once the account is approved: the <ins> tag with the
        client and slot ids, plus the loader script in the root layout. Do not
        add either before approval — running the script on an unapproved site
        does nothing useful and puts a third-party request on every page.

        An approved account also needs a Google-certified consent platform
        before serving to EEA or UK visitors. See components/Analytics.tsx.
      */}
    </aside>
  );
}
