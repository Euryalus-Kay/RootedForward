import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
