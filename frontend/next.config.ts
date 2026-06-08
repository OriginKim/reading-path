import type { NextConfig } from "next";

const BACKEND_URL = "https://reading-path-production.up.railway.app";
const isDev = process.env.NODE_ENV === "development";

const connectSrc = isDev
  ? `'self' ${BACKEND_URL} http://localhost:8000`
  : `'self' ${BACKEND_URL}`;

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; connect-src ${connectSrc}; img-src 'self' https: data:; script-src 'self' 'unsafe-eval' 'unsafe-inline';`,
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? BACKEND_URL,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.kakaocdn.net" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
