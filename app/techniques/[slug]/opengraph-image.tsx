import { ImageResponse } from "next/og";
import { getTechnique, getTechniques } from "@/lib/content";
import { SITE_NAME } from "@/lib/seo";

/**
 * The card that appears when a technique page is shared.
 *
 * Rendered at build time, one per technique. Deliberately typographic rather
 * than illustrated: there is no photograph of a shot we are allowed to use,
 * and a generated court diagram at this size would be unreadable.
 *
 * It uses the default font rather than Fraunces. Satori needs the font as
 * binary data, and next/font emits hashed files we cannot reliably resolve —
 * pulling one over the network would make every build depend on Google being
 * up. Committing a subset later is the upgrade, and it is only a share card.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getTechniques().map((t) => ({ slug: t.slug }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const technique = getTechnique(slug);

  // Satori treats every JSX expression as its own child node, so building the
  // string first keeps these divs single-child — otherwise each one needs an
  // explicit display and the build fails on the whole image.
  const firstSentence = technique ? `${technique.summary.split(". ")[0]}.` : "";

  const paper = "#fbfaf7";
  const ink = "#1a1714";
  const muted = "#6b6459";
  const accent = "#2c6b47";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: paper,
        color: ink,
        padding: 72,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: muted,
          }}
        >
          {technique
            ? `${technique.category} · ${technique.difficulty}`
            : "Technique"}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: technique && technique.name.length > 22 ? 84 : 104,
            lineHeight: 1.05,
            maxWidth: 950,
          }}
        >
          {technique?.name ?? SITE_NAME}
        </div>
      </div>

      {technique && (
        <div
          style={{
            fontSize: 32,
            lineHeight: 1.4,
            color: muted,
            maxWidth: 950,
          }}
        >
          {firstSentence}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderTop: `3px solid ${ink}`,
          paddingTop: 24,
          fontSize: 26,
        }}
      >
        <div style={{ width: 16, height: 16, background: accent }} />
        {SITE_NAME}
      </div>
    </div>,
    size,
  );
}
