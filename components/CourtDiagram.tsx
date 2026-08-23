import {
  COURT_LENGTH,
  COURT_WIDTH,
  FAR_KITCHEN_LINE,
  NEAR_KITCHEN_LINE,
  NET_DEPTH,
  topDown,
  zoneAt,
  type Point,
} from "@/lib/court";
import type { CourtDiagram as CourtDiagramData, CourtRole } from "@/lib/schema";

/**
 * Top-down court, drawn landscape: you on the left, the opponents on the
 * right, the ball travelling left to right.
 *
 * Plain inline SVG — no charting library, per the stack decision in
 * REQUIREMENTS.md §12. Every colour is a design token, so it follows the
 * theme without a single `dark:` class.
 */

const ROLE_LABELS: Record<CourtRole, string> = {
  you: "You",
  partner: "Partner",
  opponent: "Opp",
  feeder: "Feed",
};

/** Padding around the court, in feet, to fit labels. */
const PAD = 3.5;

export default function CourtDiagram({
  diagram,
  title,
  description,
  compact = false,
}: {
  diagram: CourtDiagramData;
  title: string;
  description: string;
  compact?: boolean;
}) {
  const titleId = `court-${slugify(title)}`;
  const descId = `${titleId}-desc`;

  const label = compact ? 1.5 : 1.4;

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${COURT_LENGTH + PAD * 2} ${COURT_WIDTH + PAD * 2}`}
      className="w-full"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{description}</desc>

      {/* Playing surface */}
      <rect
        x={0}
        y={0}
        width={COURT_LENGTH}
        height={COURT_WIDTH}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={0.25}
      />

      {/* Both kitchens, tinted so the no-volley zone reads at a glance */}
      <rect
        x={NEAR_KITCHEN_LINE}
        y={0}
        width={FAR_KITCHEN_LINE - NEAR_KITCHEN_LINE}
        height={COURT_WIDTH}
        fill="var(--accent)"
        opacity={0.07}
      />

      {/* Court lines */}
      <g stroke="var(--border)" strokeWidth={0.2} fill="none">
        <line
          x1={NEAR_KITCHEN_LINE}
          y1={0}
          x2={NEAR_KITCHEN_LINE}
          y2={COURT_WIDTH}
        />
        <line
          x1={FAR_KITCHEN_LINE}
          y1={0}
          x2={FAR_KITCHEN_LINE}
          y2={COURT_WIDTH}
        />
        {/* Centre line runs from each baseline up to the kitchen, not through it */}
        <line
          x1={0}
          y1={COURT_WIDTH / 2}
          x2={NEAR_KITCHEN_LINE}
          y2={COURT_WIDTH / 2}
        />
        <line
          x1={FAR_KITCHEN_LINE}
          y1={COURT_WIDTH / 2}
          x2={COURT_LENGTH}
          y2={COURT_WIDTH / 2}
        />
      </g>

      {/* Net */}
      <line
        x1={NET_DEPTH}
        y1={-1}
        x2={NET_DEPTH}
        y2={COURT_WIDTH + 1}
        stroke="var(--text)"
        strokeWidth={0.45}
      />
      <text
        x={NET_DEPTH}
        y={-1.6}
        textAnchor="middle"
        fontSize={label}
        fill="var(--text-muted)"
      >
        net
      </text>

      {!compact && (
        <>
          <text x={1} y={-1.6} fontSize={label} fill="var(--text-muted)">
            your side
          </text>
          <text
            x={COURT_LENGTH - 1}
            y={-1.6}
            textAnchor="end"
            fontSize={label}
            fill="var(--text-muted)"
          >
            their side
          </text>
          <text
            x={(NEAR_KITCHEN_LINE + FAR_KITCHEN_LINE) / 2}
            y={COURT_WIDTH + 2.4}
            textAnchor="middle"
            fontSize={label}
            fill="var(--text-muted)"
          >
            kitchen
          </text>
        </>
      )}

      {/* Targets sit under everything else so markers stay readable */}
      {diagram.targets.map((t) => {
        const { x, y } = topDown(t.at as Point);
        return (
          <g key={t.label}>
            <rect
              x={x - t.depth / 2}
              y={y - t.width / 2}
              width={t.depth}
              height={t.width}
              fill="var(--accent)"
              opacity={0.22}
              stroke="var(--accent)"
              strokeWidth={0.2}
              strokeDasharray="0.8 0.6"
              rx={0.4}
            />
            {/* Below the box, not inside it: a target is only a few feet
                across, and a label centred in it runs over whoever is
                standing nearby. */}
            <text
              x={x}
              y={y + t.width / 2 + 1.6}
              textAnchor="middle"
              fontSize={label}
              fill="var(--accent)"
            >
              {t.label}
            </text>
          </g>
        );
      })}

      {/* Movement after the shot */}
      {diagram.movement.map((m, i) => {
        const a = topDown(m.from as Point);
        const b = topDown(m.to as Point);
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--text-muted)"
            strokeWidth={0.3}
            strokeDasharray="1 0.8"
            markerEnd="url(#court-arrow-muted)"
          />
        );
      })}

      {/* The mistake, drawn first so the correct shot sits on top */}
      {diagram.mistake && (
        <ShotArc
          path={diagram.mistake.path}
          color="var(--difficulty-advanced)"
          dashed
        />
      )}
      {diagram.shot && <ShotArc path={diagram.shot} color="var(--accent)" />}

      {diagram.players.map((p, i) => {
        const { x, y } = topDown(p.at as Point);
        const mine = p.role === "you" || p.role === "partner";
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={1.15}
              fill={mine ? "var(--accent)" : "var(--bg)"}
              stroke={mine ? "var(--accent)" : "var(--text-muted)"}
              strokeWidth={0.3}
            />
            <text
              x={x}
              y={y + 3}
              textAnchor="middle"
              fontSize={label}
              fill="var(--text-muted)"
            >
              {ROLE_LABELS[p.role]}
            </text>
          </g>
        );
      })}

      <defs>
        <marker
          id="court-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
        </marker>
        <marker
          id="court-arrow-bad"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--difficulty-advanced)" />
        </marker>
        <marker
          id="court-arrow-muted"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
        </marker>
      </defs>
    </svg>
  );
}

/**
 * The ball's path seen from above. Bowed slightly sideways so a shot that is
 * nearly straight still reads as a flight path rather than a ruler line.
 */
function ShotArc({
  path,
  color,
  dashed = false,
}: {
  path: { from: Point; to: Point };
  color: string;
  dashed?: boolean;
}) {
  const a = topDown(path.from);
  const b = topDown(path.to);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = 1.6;
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;

  return (
    <path
      d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
      fill="none"
      stroke={color}
      strokeWidth={0.35}
      strokeDasharray={dashed ? "1.2 0.9" : undefined}
      markerEnd={dashed ? "url(#court-arrow-bad)" : "url(#court-arrow)"}
    />
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export { zoneAt };
