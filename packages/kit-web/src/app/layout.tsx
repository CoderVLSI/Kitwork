import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kitwork — Your Own Git",
  description: "A complete version control system with a CLI, server API, and web interface. Push, pull, branch, and merge — your code, your way.",
  keywords: ["git", "version control", "kitwork", "vcs", "repository", "code hosting"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${dmSans.variable} ${jetbrains.variable} antialiased noise-overlay`}>
        <ConvexClientProvider>
          <Navbar />
          <main>{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
