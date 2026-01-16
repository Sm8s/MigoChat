import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignoriert Linting-Fehler während des Builds auf Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignoriert TypeScript-Fehler beim Build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Korrekte Konfiguration für externe Bilder (ersetzt das veraltete 'domains')
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;