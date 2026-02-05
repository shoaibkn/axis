import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for Edge Runtime compatibility
  // Note: Individual routes can specify edge runtime
  serverExternalPackages: ['convex'],
  // Ensure Convex works properly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
