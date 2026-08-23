/**
 * Court geometry, in feet.
 *
 * Content is authored in real court measurements — a coach can read "[10, 1]"
 * as "middle of the court, a foot behind the baseline" without translating
 * anything. All the SVG mapping happens here.
 *
 * Court coordinates are [lateral, depth]:
 *   lateral  0 = left sideline .. 20 = right sideline
 *   depth    0 = your baseline .. 44 = the opponents' baseline
 *
 * Diagrams are drawn in **landscape**: you on the left, the opponents on the
 * right, the ball travelling left to right. The side-on trajectory view uses
 * the same left-to-right axis, so the two diagrams read as one journey seen
 * from two angles.
 */

export const COURT_WIDTH = 20;
export const COURT_LENGTH = 44;
export const NET_DEPTH = COURT_LENGTH / 2; // 22
export const KITCHEN_DEPTH = 7;
export const NET_HEIGHT = 3; // 34in at centre, 36in at the posts — 3ft is close enough to draw

/** Kitchen line on your side / on theirs. */
export const NEAR_KITCHEN_LINE = NET_DEPTH - KITCHEN_DEPTH; // 15
export const FAR_KITCHEN_LINE = NET_DEPTH + KITCHEN_DEPTH; // 29

export type Point = [lateral: number, depth: number];

/** Court point → SVG point for the top-down (landscape) view. */
export function topDown([lateral, depth]: Point): { x: number; y: number } {
  return { x: depth, y: lateral };
}

/** Which named zone a depth falls in, from the hitter's point of view. */
export function zoneAt(depth: number): string {
  if (depth < NEAR_KITCHEN_LINE) return "your baseline side";
  if (depth < NET_DEPTH) return "your kitchen";
  if (depth < FAR_KITCHEN_LINE) return "their kitchen";
  return "their baseline side";
}

/**
 * Samples a parabola through start → peak → end and returns an SVG path.
 *
 * Used for the side-on view, where the whole point is *where the ball peaks*.
 * A drop that peaks before the net cannot be attacked; the same shot peaking
 * after the net arrives at chest height. Three-point interpolation puts the
 * apex exactly where the content says it is, which a bezier control point
 * would not.
 */
export function parabolaPath(
  from: { x: number; y: number },
  peak: { x: number; y: number },
  to: { x: number; y: number },
  samples = 48,
): string {
  const pts: [number, number][] = [
    [from.x, from.y],
    [peak.x, peak.y],
    [to.x, to.y],
  ];

  // Lagrange interpolation through the three points.
  const yAt = (x: number) =>
    pts.reduce((sum, [xi, yi], i) => {
      const basis = pts.reduce(
        (acc, [xj], j) => (i === j ? acc : (acc * (x - xj)) / (xi - xj)),
        1,
      );
      return sum + yi * basis;
    }, 0);

  const step = (to.x - from.x) / samples;
  const d = [`M ${from.x.toFixed(2)} ${from.y.toFixed(2)}`];
  for (let i = 1; i <= samples; i++) {
    const x = from.x + step * i;
    d.push(`L ${x.toFixed(2)} ${yAt(x).toFixed(2)}`);
  }
  return d.join(" ");
}

/** The fraction along a shot at which it crosses the net. */
export function netCrossingFraction(from: Point, to: Point): number {
  const span = to[1] - from[1];
  if (span === 0) return 0.5;
  return (NET_DEPTH - from[1]) / span;
}
