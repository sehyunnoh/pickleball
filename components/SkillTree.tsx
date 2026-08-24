"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { NODE_HEIGHT, NODE_WIDTH, type TreeLayout } from "@/lib/skill-tree";

/**
 * The skill tree, laid out on the server and coloured in the browser.
 *
 * Nodes are real links inside a <foreignObject>, so keyboard navigation, focus
 * rings and middle-click all behave the way they do everywhere else on the
 * site. Drawing them as SVG shapes with click handlers would mean rebuilding
 * all of that by hand and getting some of it wrong.
 */
export default function SkillTree({ layout }: { layout: TreeLayout }) {
  const { learned } = useProgress();

  return (
    <div>
      <div className="overflow-x-auto border-y border-border py-6">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          className="max-w-none"
          role="group"
          aria-label="Skill tree: which techniques come before which"
        >
          <g>
            {layout.edges.map((edge) => (
              <path
                key={`${edge.from}-${edge.to}`}
                d={edge.path}
                fill="none"
                stroke="var(--border)"
                strokeWidth={1.5}
              />
            ))}
          </g>

          {layout.nodes.map((node) => {
            const done = learned.has(node.slug);
            return (
              <foreignObject
                key={node.slug}
                x={node.x}
                y={node.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
              >
                <Link
                  href={`/techniques/${node.slug}`}
                  className={`flex h-full w-full flex-col justify-center border px-3 no-underline transition-colors ${
                    done
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface hover:border-accent"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[13px] leading-tight font-medium text-text">
                    {done && (
                      <span aria-hidden="true" className="text-accent">
                        ✓
                      </span>
                    )}
                    {node.name}
                  </span>
                  {/* Not the .label utility: its 0.14em tracking is wide
                      enough to wrap this onto a second line inside a node. */}
                  <span className="mt-0.5 font-mono text-[9px] tracking-[0.06em] whitespace-nowrap text-muted uppercase">
                    {node.difficulty}
                    {!node.published && " · draft"}
                  </span>
                </Link>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Read it left to right: everything in a column depends on something in
        the one before it. Marks are saved on this device only.
      </p>

      {/* The graph is drawn, so it also has to be readable without seeing it. */}
      <details className="mt-6">
        <summary className="label cursor-pointer text-muted hover:text-accent">
          Read the tree as a list
        </summary>
        <ol className="mt-4 space-y-3">
          {layout.nodes.map((node) => {
            const before = layout.edges
              .filter((e) => e.to === node.slug)
              .map((e) => layout.nodes.find((n) => n.slug === e.from)?.name)
              .filter(Boolean);
            return (
              <li key={node.slug} className="text-sm">
                <Link
                  href={`/techniques/${node.slug}`}
                  className="text-accent hover:underline"
                >
                  {node.name}
                </Link>
                <span className="text-muted">
                  {before.length === 0
                    ? " — start here"
                    : ` — after ${before.join(", ")}`}
                </span>
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}
