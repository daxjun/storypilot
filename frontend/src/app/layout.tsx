import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

// Self-hosted Geist (no request to Google Fonts at build or run time).
const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: { default: "StoryPilot", template: "%s · StoryPilot" },
  description: "Discover, evaluate and rank promotional clips from microdrama screenplays.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <AppShell>{children}</AppShell>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
