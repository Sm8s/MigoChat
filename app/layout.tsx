import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MigoChat",
  description: "Mein Supabase Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}