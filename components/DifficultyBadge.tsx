import type { Difficulty } from "@/lib/schema";

const STYLES: Record<Difficulty, string> = {
  beginner:
    "text-[var(--difficulty-beginner)] bg-[var(--difficulty-beginner-soft)]",
  intermediate:
    "text-[var(--difficulty-intermediate)] bg-[var(--difficulty-intermediate-soft)]",
  advanced:
    "text-[var(--difficulty-advanced)] bg-[var(--difficulty-advanced-soft)]",
};

const LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/**
 * Difficulty always ships as colour *plus* the word. Colour alone would fail
 * WCAG 1.4.1 and is useless to anyone with a red/green deficiency — which,
 * with a green accent and a red "advanced", would be most of them.
 */
export default function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[difficulty]}`}
    >
      {LABELS[difficulty]}
    </span>
  );
}
