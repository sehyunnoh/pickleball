import type { Difficulty, Technique } from "./schema";

/**
 * Layout for the skill tree.
 *
 * The graph has no file of its own — it is derived from `prerequisites` and
 * `leadsTo` on the technique files, which are the single source of truth
 * (REQUIREMENTS.md §7.1). Both directions are unioned: `validate` warns when
 * an edge is declared from only one end, but the tree should still draw it.
 *
 * Laid out left to right, the way the court diagrams read, with rank meaning
 * "how many techniques you have to learn before this one". Hand-rolled rather
 * than pulled from a graph library: thirty nodes in a shallow DAG is a layered
 * layout anyone can read in a debugger, and REQUIREMENTS.md §12 already
 * settled on plain SVG.
 */

export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 46;
const COLUMN_GAP = 76;
const ROW_GAP = 18;
const PADDING = 8;

export type TreeNode = {
  slug: string;
  name: string;
  difficulty: Difficulty;
  published: boolean;
  x: number;
  y: number;
  rank: number;
};

export type TreeEdge = {
  from: string;
  to: string;
  path: string;
};

export type TreeLayout = {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
};

export function buildSkillTree(techniques: Technique[]): TreeLayout {
  const byslug = new Map(techniques.map((t) => [t.slug, t]));

  // Edge set, deduplicated. Only edges where both ends are visible: a
  // prerequisite that has not been written yet is rendered on the technique
  // page as plain text, and it cannot be a node here.
  const edgeKeys = new Set<string>();
  for (const t of techniques) {
    for (const p of t.prerequisites) {
      if (byslug.has(p)) edgeKeys.add(`${p}|${t.slug}`);
    }
    for (const next of t.leadsTo) {
      if (byslug.has(next)) edgeKeys.add(`${t.slug}|${next}`);
    }
  }

  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const key of edgeKeys) {
    const [from, to] = key.split("|");
    (children.get(from) ?? children.set(from, []).get(from)!).push(to);
    (parents.get(to) ?? parents.set(to, []).get(to)!).push(from);
  }

  // Rank = longest path from a root, so a technique always sits to the right of
  // everything it depends on. `validate` guarantees the graph is acyclic, but
  // the visited set keeps a bad file from hanging the build anyway.
  const rank = new Map<string, number>();
  const resolving = new Set<string>();

  function rankOf(slug: string): number {
    const cached = rank.get(slug);
    if (cached !== undefined) return cached;
    if (resolving.has(slug)) return 0;

    resolving.add(slug);
    const ps = parents.get(slug) ?? [];
    const value = ps.length === 0 ? 0 : Math.max(...ps.map(rankOf)) + 1;
    resolving.delete(slug);

    rank.set(slug, value);
    return value;
  }
  for (const t of techniques) rankOf(t.slug);

  // Group by rank, then order each column by the average position of its
  // parents in the previous one. One pass is enough at this size and it keeps
  // related branches next to each other instead of interleaved.
  const columns: string[][] = [];
  for (const t of techniques) {
    const r = rank.get(t.slug)!;
    (columns[r] ??= []).push(t.slug);
  }

  const rowOf = new Map<string, number>();
  columns.forEach((column, index) => {
    if (index === 0) {
      column.sort((a, b) =>
        byslug.get(a)!.name.localeCompare(byslug.get(b)!.name),
      );
    } else {
      column.sort((a, b) => {
        const key = (slug: string) => {
          const ps = (parents.get(slug) ?? []).filter((p) => rowOf.has(p));
          if (ps.length === 0) return Number.MAX_SAFE_INTEGER;
          return ps.reduce((sum, p) => sum + rowOf.get(p)!, 0) / ps.length;
        };
        return (
          key(a) - key(b) ||
          byslug.get(a)!.name.localeCompare(byslug.get(b)!.name)
        );
      });
    }
    column.forEach((slug, row) => rowOf.set(slug, row));
  });

  const nodes: TreeNode[] = [];
  for (const [columnIndex, column] of columns.entries()) {
    column.forEach((slug, row) => {
      const t = byslug.get(slug)!;
      nodes.push({
        slug,
        name: t.name,
        difficulty: t.difficulty,
        published: t.status === "published",
        rank: columnIndex,
        x: PADDING + columnIndex * (NODE_WIDTH + COLUMN_GAP),
        y: PADDING + row * (NODE_HEIGHT + ROW_GAP),
      });
    });
  }

  const position = new Map(nodes.map((n) => [n.slug, n]));

  const edges: TreeEdge[] = [...edgeKeys].map((key) => {
    const [from, to] = key.split("|");
    const a = position.get(from)!;
    const b = position.get(to)!;
    const x1 = a.x + NODE_WIDTH;
    const y1 = a.y + NODE_HEIGHT / 2;
    const x2 = b.x;
    const y2 = b.y + NODE_HEIGHT / 2;
    const midpoint = x1 + (x2 - x1) / 2;
    return {
      from,
      to,
      path: `M ${x1} ${y1} C ${midpoint} ${y1}, ${midpoint} ${y2}, ${x2} ${y2}`,
    };
  });

  const width =
    PADDING * 2 +
    columns.length * NODE_WIDTH +
    (columns.length - 1) * COLUMN_GAP;
  const tallest = Math.max(1, ...columns.map((c) => c.length));
  const height = PADDING * 2 + tallest * NODE_HEIGHT + (tallest - 1) * ROW_GAP;

  return { nodes, edges, width, height };
}
