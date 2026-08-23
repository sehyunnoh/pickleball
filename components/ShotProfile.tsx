import {
  COURT_LENGTH,
  FAR_KITCHEN_LINE,
  NEAR_KITCHEN_LINE,
  NET_DEPTH,
  NET_HEIGHT,
  parabolaPath,
  type Point,
} from "@/lib/court";
import type { ShotPath } from "@/lib/schema";

/**
 * The court seen from the sideline, showing how high the ball goes and —
 * the part that matters — *where it peaks*.
 *
 * A drop that reaches its apex before the net falls as it crosses and cannot
 * be attacked. The same swing peaking after the net arrives at chest height.
 * That distinction is one sentence of prose and one obvious picture, which is
 * why this diagram exists.
 */

const MAX_HEIGHT = 12; // feet of vertical space drawn
const PAD_X = 2;
const PAD_TOP = 2;
const PAD_BOTTOM = 3.5;

/** Ball height at contact and at landing, in feet. */
const CONTACT_HEIGHT = 2;
const LANDING_HEIGHT = 0;

export default function ShotProfile({
  shot,
  mistake,
  title,
  description,
}: {
  shot: ShotPath;
  mistake?: { label: string; path: ShotPath };
  title: string;
  description: string;
}) {
  const titleId = `profile-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const descId = `${titleId}-desc`;

  // SVG y grows downward; the court floor sits at MAX_HEIGHT.
  const floor = MAX_HEIGHT;
  const toY = (feet: number) => floor - feet;

  return (
    <svg
      viewBox={`${-PAD_X} ${-PAD_TOP} ${COURT_LENGTH + PAD_X * 2} ${
        MAX_HEIGHT + PAD_TOP + PAD_BOTTOM
      }`}
      className="w-full"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{description}</desc>

      {/* Kitchen, so "lands in the kitchen" is visible rather than asserted */}
      <rect
        x={NEAR_KITCHEN_LINE}
        y={toY(0)}
        width={FAR_KITCHEN_LINE - NEAR_KITCHEN_LINE}
        height={0.9}
        fill="var(--accent)"
        opacity={0.18}
      />

      {/* Ground */}
      <line
        x1={0}
        y1={toY(0)}
        x2={COURT_LENGTH}
        y2={toY(0)}
        stroke="var(--border)"
        strokeWidth={0.25}
      />

      {/* Net */}
      <line
        x1={NET_DEPTH}
        y1={toY(0)}
        x2={NET_DEPTH}
        y2={toY(NET_HEIGHT)}
        stroke="var(--text)"
        strokeWidth={0.4}
      />
      {/* Labels live below the ground line: above it is where the two
          trajectories cross, and text there collides with them. */}
      <text
        x={NET_DEPTH}
        y={toY(0) + 2.2}
        textAnchor="middle"
        fontSize={1.4}
        fill="var(--text-muted)"
      >
        net
      </text>
      <text
        x={FAR_KITCHEN_LINE + 0.8}
        y={toY(0) + 2.2}
        fontSize={1.4}
        fill="var(--text-muted)"
      >
        kitchen
      </text>

      {/* The mistake carries no apex label — the dot plus the dashed legend
          under the figure says it, and a second "peak" here lands on top of
          the first one. */}
      {mistake && (
        <Trajectory
          shot={mistake.path}
          toY={toY}
          color="var(--difficulty-advanced)"
          dashed
        />
      )}
      <Trajectory shot={shot} toY={toY} color="var(--accent)" labelPeak />
    </svg>
  );
}

function Trajectory({
  shot,
  toY,
  color,
  dashed = false,
  labelPeak = false,
}: {
  shot: ShotPath;
  toY: (feet: number) => number;
  color: string;
  dashed?: boolean;
  labelPeak?: boolean;
}) {
  const from = shot.from as Point;
  const to = shot.to as Point;

  const startX = from[1];
  const endX = to[1];
  const peakX = startX + (endX - startX) * shot.peakAt;

  const d = parabolaPath(
    { x: startX, y: toY(CONTACT_HEIGHT) },
    { x: peakX, y: toY(shot.peakHeight) },
    { x: endX, y: toY(LANDING_HEIGHT) },
  );

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={0.35}
        strokeDasharray={dashed ? "1.2 0.9" : undefined}
        strokeLinecap="round"
      />
      {/* The apex is the whole point of this view, so it gets a marker. */}
      <circle cx={peakX} cy={toY(shot.peakHeight)} r={0.5} fill={color} />
      <line
        x1={peakX}
        y1={toY(shot.peakHeight)}
        x2={peakX}
        y2={toY(0)}
        stroke={color}
        strokeWidth={0.12}
        strokeDasharray="0.5 0.5"
        opacity={0.6}
      />
      {labelPeak && (
        <text
          x={peakX}
          y={toY(shot.peakHeight) - 1}
          textAnchor="middle"
          fontSize={1.3}
          fill={color}
        >
          peak
        </text>
      )}
    </g>
  );
}
