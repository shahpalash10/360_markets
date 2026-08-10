import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/motion/components/SmoothScrollProvider";
import { ScrollProgress } from "@/motion/components/ScrollProgress";
import Script from "next/script";

export const metadata: Metadata = {
  title: "MARKETS — The Educational Marketplace for Knowledge",
  description:
    "Premium Web3 & Fintech educational marketplace connecting verified traders, quantitative educators, and investors. Discover courses, digital materials, and live webinars.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0B0B0B] text-white min-h-screen flex flex-col font-sans selection:bg-[#8BE000] selection:text-black">
        <AuthProvider>
          <LanguageProvider>
            <SmoothScrollProvider>
              <ScrollProgress />
              <Header />
              <main className="flex-1 bg-[#0B0B0B] text-white">{children}</main>
              <Footer />
              {/* Load Spline Web Component Viewer Script */}
              <Script
                src="https://unpkg.com/@splinetool/viewer@1.9.0/build/spline-viewer.js"
                type="module"
                strategy="lazyOnload"
              />
            </SmoothScrollProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
