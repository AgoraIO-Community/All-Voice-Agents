import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? "https://livekit-voiceagent.vercel.app"
      : undefined,
  experimental: {},
};

export default nextConfig;
