import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Add CDN/upload host patterns here when configured
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.netlify.app" },
    ],
  },
  experimental: {
    // Auth.js v5 + Prisma needs server actions and webcrypto
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
