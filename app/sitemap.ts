import type { MetadataRoute } from "next";
import { getPaths, getTechniques, getTerms, getVenues } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

/**
 * Every page that should be indexed. Drafts are excluded automatically,
 * because in a production build the loaders never return them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const techniques = getTechniques();
  const terms = getTerms();
  const venues = getVenues();
  const paths = getPaths();

  const newest = techniques
    .map((t) => t.updatedAt)
    .sort()
    .at(-1);

  return [
    { url: base, lastModified: newest, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/techniques`,
      lastModified: newest,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/skill-tree`,
      lastModified: newest,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      // Local search is the winnable half of this site's SEO, so the courts
      // page ranks with the technique index rather than below it.
      url: `${base}/courts`,
      lastModified: venues
        .map((v) => v.checkedAt)
        .sort()
        .at(-1),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      // Paths are an entry point for people who cannot name the shot they
      // need, which is most of the long tail this site is aiming at.
      url: `${base}/paths`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...paths.map((p) => ({
      url: `${base}/paths/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${base}/about`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/glossary`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // The technique pages are the point of the site, so they outrank the
    // listings that lead to them.
    ...techniques.map((t) => ({
      url: `${base}/techniques/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...terms.map((t) => ({
      url: `${base}/glossary/${t.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
