import type { Metadata } from "next";
import SkillTree from "@/components/SkillTree";
import { getTechniques } from "@/lib/content";
import { buildSkillTree } from "@/lib/skill-tree";

export const metadata: Metadata = {
  title: "Skill tree",
  description:
    "Which pickleball techniques come before which, and what each one opens up.",
};

export default function SkillTreePage() {
  const layout = buildSkillTree(getTechniques());

  return (
    <div className="mx-auto max-w-[64rem] px-6 py-12 md:py-16">
      <h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-medium">
        Skill tree
      </h1>
      <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
        The order these are worth learning in. It is built from the
        prerequisites on each technique, not maintained separately, so it can
        never drift from the pages themselves.
      </p>

      <div className="mt-10">
        {layout.nodes.length === 0 ? (
          <p className="border-y border-border py-10 text-center text-muted">
            No techniques published yet.
          </p>
        ) : (
          <SkillTree layout={layout} />
        )}
      </div>
    </div>
  );
}
