import type { NextConfig } from "next";

const rawServerUrl =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000/api/v1";

const parseBackend = (value: string) => {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname.replace(/\/+$/, "") || "/api/v1";
    return {
      origin: parsed.origin,
      path: path.startsWith("/") ? path : `/${path}`,
    };
  } catch {
    return {
      origin: "http://localhost:8000",
      path: "/api/v1",
    };
  }
};

const backend = parseBackend(rawServerUrl);

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow Mapbox GL and external image domains
  images: {
    unoptimized: true,
  },
  // Turbopack handles SVG imports natively
  webpack(config) {
    // SVG files imported via default import should return { src, width, height }
    // Next.js handles this by default through its static asset pipeline
    return config;
  },
  // Allowed hosts for deployment
  allowedDevOrigins: [
    "*.us-east-2.elb.amazonaws.com",
  ],
  async rewrites() {
    return [
      {
        source: `${backend.path}/:path*`,
        destination: `${backend.origin}${backend.path}/:path*`,
      },
      {
        source: backend.path,
        destination: `${backend.origin}${backend.path}`,
      },
    ];
  },
};

export default nextConfig;
