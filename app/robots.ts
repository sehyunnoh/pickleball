import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// Required by `output: export` — there is no server to generate this on
// request, so it has to be nailed down as static at build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
