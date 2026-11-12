import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { DemoBanner } from "@/components/demo-banner";
import { isDemoMode, publicEnv } from "@/lib/env";
import { ORG } from "@/lib/config";
import "./globals.css";

// Self-hosted Inter (variable, latin) so builds never depend on fetching Google Fonts.
const inter = localFont({
  src: "./fonts/inter-latin-var.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: { default: ORG.portalName, template: `%s · ${ORG.shortName}` },
  description: `Membership portal for the ${ORG.name}.`,
  applicationName: ORG.portalName,
  appleWebApp: { capable: true, title: ORG.shortName, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0B2545",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {isDemoMode() && <DemoBanner />}
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
