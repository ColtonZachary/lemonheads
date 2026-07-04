import path from "node:path";
import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

/** Set to a subpath when deploying as a GitHub Pages project site (e.g. `/your-repo`). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: isStaticExport
    ? { unoptimized: true }
    : {
        remotePatterns: [
          { protocol: "https", hostname: "images.unsplash.com" },
          { protocol: "https", hostname: "source.unsplash.com" },
          { protocol: "https", hostname: "picsum.photos" },
          ...(supabaseHost
            ? [
                {
                  protocol: "https" as const,
                  hostname: supabaseHost,
                  pathname: "/storage/v1/object/public/**",
                },
              ]
            : []),
        ],
      },
};

export default nextConfig;
