import Link from "next/link";
import type { Comparison } from "@/lib/schema";

/**
 * This shot against the one it gets confused with.
 *
 * Wrapped in an overflow container: on a 375px phone three columns of prose
 * will not fit, and the table scrolling inside its own box is far better than
 * the whole page scrolling sideways.
 */
export default function ComparisonTable({
  comparison,
  selfLabel,
  otherHref,
}: {
  comparison: Comparison;
  selfLabel: string;
  otherHref: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="sr-only">{comparison.title}</caption>
        <thead>
          <tr className="border-y border-rule">
            <th
              scope="col"
              className="label w-1/5 py-3 pr-4 align-bottom text-muted"
            >
              <span className="sr-only">Aspect</span>
            </th>
            <th
              scope="col"
              className="label py-3 pr-4 align-bottom text-accent"
            >
              {selfLabel}
            </th>
            <th scope="col" className="label py-3 pr-4 align-bottom text-muted">
              {otherHref ? (
                <Link href={otherHref} className="text-accent hover:underline">
                  {comparison.otherLabel}
                </Link>
              ) : (
                <span className="text-muted">{comparison.otherLabel}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-border last:border-0"
            >
              <th
                scope="row"
                className="label w-1/5 py-4 pr-4 text-left align-top font-normal text-muted"
              >
                {row.label}
              </th>
              <td className="py-4 pr-4 align-top leading-relaxed">
                {row.self}
              </td>
              <td className="py-4 pr-4 align-top leading-relaxed text-muted">
                {row.other}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
