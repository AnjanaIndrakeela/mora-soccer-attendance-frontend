import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Lets phones on the same Wi-Fi use the dev server via this computer's IP (e.g. "192.168.1.20"),
  // so players can scan session QR codes while testing locally.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  // Proxy /api/* to the backend so the browser sees one origin: the auth cookie is first-party
  // and src/proxy.ts can read it for route protection.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/:path*` }];
  },
};

export default nextConfig;
