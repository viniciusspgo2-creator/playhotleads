import type { NextConfig } from "next";

// Segurança p/ todos os documentos. Sem X-Frame-Options de propósito: o app
// foi desenhado p/ funcionar também em iframe cross-site (cookies partitioned).
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // standalone só para rodar fora da Vercel (Docker/bun); a Vercel faz o próprio build
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  compress: true,
  reactStrictMode: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "playhotleads.vercel.app" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
