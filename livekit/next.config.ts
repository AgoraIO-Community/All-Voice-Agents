import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      {
        source: "/livekit",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
