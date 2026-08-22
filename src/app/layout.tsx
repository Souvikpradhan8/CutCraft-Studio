import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ToasterProvider } from "@/components/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jb = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jb" });

export const metadata: Metadata = {
  title: "CutCraft — Cinematic video editing in the browser",
  description:
    "Cut, trim, merge and enhance footage up to 4K. Filters, effects, transitions and keyframes in one fluid studio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} ${jb.variable}`}>
      <body className="min-h-screen bg-ink-950 font-sans text-zinc-200 antialiased">
        <ToasterProvider>{children}</ToasterProvider>
      </body>
    </html>
  );
}
