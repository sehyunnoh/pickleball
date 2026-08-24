"use client";

/**
 * Errors thrown by the root layout itself.
 *
 * This replaces <html> wholesale, so none of the site's fonts, tokens or
 * layout are available — the styles here are inline on purpose. It should
 * essentially never render; if it does, something is wrong at the very top of
 * the tree and the only useful thing is a legible sentence and a way out.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#fbfaf7",
          color: "#1a1714",
          fontFamily: "Georgia, 'Times New Roman', serif",
          margin: 0,
          padding: "4rem 1.5rem",
        }}
      >
        <main style={{ maxWidth: "34rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", lineHeight: 1.1, margin: 0 }}>
            The site failed to load.
          </h1>
          <p style={{ marginTop: "1.5rem", lineHeight: 1.7, color: "#6b6459" }}>
            Something went wrong before the page could be built. Reloading
            usually fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: 0,
              background: "none",
              border: "none",
              borderBottom: "2px solid #2c6b47",
              color: "#2c6b47",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "3rem",
                fontSize: "0.8rem",
                color: "#6b6459",
              }}
            >
              Reference {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
