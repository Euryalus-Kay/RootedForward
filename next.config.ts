import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* /kiosk/map serves the bundled kiosk file itself. It used to be an
     iframe inside a Next page, which meant fighting the site-wide
     X-Frame-Options DENY. Serving it directly removes the frame, the
     header exception and a wrapper document from the critical path. */
  async rewrites() {
    return {
      beforeFiles: [{ source: "/kiosk/map", destination: "/kiosk/map-kiosk.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
  allowedDevOrigins: ["192.168.87.34", "localhost"],
  // pdfkit bundles its font-metric files using relative require() paths;
  // keeping it external avoids Next.js rewriting those paths at build time
  // and losing the .afm font-metric files needed to instantiate a document.
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
