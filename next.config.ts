import type { NextConfig } from "next";

// GitHub Pages serves this repo at /pickleball, not the domain root, and has
// no server to run — so the build has to be a plain static export and every
// route has to know its own prefix.
const BASE_PATH = "/pickleball";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  images: {
    // Static export has no image-optimization server, and YouTube thumbnails
    // are already served unoptimized (see LiteYouTube) so nothing depends on
    // the loader anyway.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
