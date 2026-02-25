import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        <ConvexClientProvider>
          <Navbar />
          <main>{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
