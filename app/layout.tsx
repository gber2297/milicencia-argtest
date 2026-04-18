import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalyticsPageViews } from "@/components/analytics/analytics-page-views";
import { WebAnalytics } from "@/components/analytics/web-analytics";
import { TopNav } from "@/components/app/top-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MiLicencia Argentina 🇦🇷 | Practica para la licencia",
  description:
    "MiLicencia Argentina 🇦🇷 te ayuda a practicar el teorico vial de Argentina con examenes simulados y progreso",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="min-h-full overflow-x-hidden text-zinc-900">
        <WebAnalytics />
        <AnalyticsPageViews />
        <TopNav />
        <main className="mx-auto min-h-[calc(100dvh-3.5rem)] min-w-0 w-full max-w-6xl flex-1 overflow-x-hidden px-3 py-6 sm:min-h-[calc(100dvh-4rem)] sm:px-6 sm:py-9">
          {children}
        </main>
      </body>
    </html>
  );
}
