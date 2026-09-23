import type { NextConfig } from "next";

// Server-to-server URL for the backend. In Docker Compose this is the
// service name ("http://backend:5000"); for local dev without Docker it
// defaults to the backend running on localhost.
const backendUrl = process.env.INTERNAL_API_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
