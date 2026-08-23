/**
 * Plain helpers, deliberately outside any "use client" module: a server
 * component can only import the *component* from a client module, so a
 * function that both sides call has to live somewhere neutral.
 */

/** "1:14" / "12:03" — clip start marks and lengths. */
export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
