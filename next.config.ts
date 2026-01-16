import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignoriert Linting-Fehler beim Build auf Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignoriert TypeScript-Fehler beim Build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Korrekte Konfiguration für Bilder (behebt die Warnung im Screenshot)
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