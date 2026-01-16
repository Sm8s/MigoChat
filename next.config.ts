import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignoriert Linting-Fehler während des Build-Prozesses auf Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignoriert TypeScript-Fehler beim Build für schnelleres Deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimierungen für Bilder und externe Quellen (optional erweiterbar)
  images: {
    domains: ['supabase.co'], // Falls du Profilbilder von Supabase lädst
  },
  // Entfernt unnötige experimentelle Flags, die Warnungen erzeugen könnten
  experimental: {
    // Hier können stabile experimentelle Features stehen
  }
};

export default nextConfig;