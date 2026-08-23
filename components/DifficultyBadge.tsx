import type { Difficulty } from "@/lib/schema";

const COLORS: Record<Difficulty, string> = {
  beginner: "var(--difficulty-beginner)",
  intermediate: "var(--difficulty-intermediate)",
  advanced: "var(--difficulty-advanced)",
};

/**
 * Difficulty as a small square of colour followed by the word.
 *
 * A pill badge is the single most recognisable framework-default component on
 * the web, and colour on its own would fail WCAG 1.4.1 anyway — with a green
 * accent and a red "advanced", most readers with a colour deficiency would be
 * reading two identical grey pills.
 */
export default function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}) {
  return (
    <span className="label inline-flex items-center gap-2 text-muted">
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 shrink-0"
        style={{ background: COLORS[difficulty] }}
      />
      {difficulty}
    </span>
  );
}
