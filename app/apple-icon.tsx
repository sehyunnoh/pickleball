import { ImageResponse } from "next/og";

/**
 * The home-screen icon on iOS.
 *
 * The same ball as `icon.svg`, redrawn because Apple will not take an SVG and
 * because this one is never seen at 16px — at 180 the holes can sit where a
 * real ball's do rather than where the pixel grid allows.
 *
 * Satori has no <circle>, so each hole is a div rounded to a disc. Opaque
 * throughout: iOS composites touch icons on white and applies its own corner
 * radius, so a transparent background would come back as a white square.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const GREEN = "#2c6b47";
const PAPER = "#fbfaf7";

/** Centres in the same 32-unit space as `icon.svg`, scaled up. */
const SCALE = size.width / 32;
const HOLE_R = 3.1 * SCALE;
const HOLES = [
  [16, 8.6],
  [23.04, 13.71],
  [20.35, 21.99],
  [11.65, 21.99],
  [8.96, 13.71],
];

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: GREEN,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 26 * SCALE,
            height: 26 * SCALE,
            borderRadius: "50%",
            background: PAPER,
          }}
        >
          {HOLES.map(([x, y]) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                // The holes are positioned against the ball, not the square,
                // so subtract the ball's own offset (3 units on each side).
                left: (x - 3) * SCALE - HOLE_R,
                top: (y - 3) * SCALE - HOLE_R,
                width: HOLE_R * 2,
                height: HOLE_R * 2,
                borderRadius: "50%",
                background: GREEN,
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
