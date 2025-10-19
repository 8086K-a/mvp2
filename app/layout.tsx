import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SupabaseAuthProvider } from "@/components/supabase-auth-provider";
import { GeoProvider } from "@/components/geo-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RandomLife - Daily Discovery (BETA)",
  description:
    "⚠️ BETA VERSION - Discover something new every day with AI-powered recommendations. This is a testing version with limited functionality.",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  generator: "v0.dev",
  robots: "noindex, nofollow", // 阻止搜索引擎索引
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GeoProvider>
          <SupabaseAuthProvider>
            <div className="min-h-screen bg-[#F7F9FC]">{children}</div>
            <Toaster />
          </SupabaseAuthProvider>
        </GeoProvider>
      </body>
    </html>
  );
}
