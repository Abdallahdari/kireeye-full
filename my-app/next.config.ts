import type { NextConfig } from "next";

// Server-to-server URL for the backend. In Docker Compose this is the
// service name ("http://backend:5000"); for local dev without Docker it
// defaults to the backend running on localhost.
const backendUrl = process.env.INTERNAL_API_URL ?? "http://localhost:5000";

// Sent on every page. frame-ancestors / X-Frame-Options stop other sites from
// embedding Kireeye in an invisible frame (clickjacking).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
