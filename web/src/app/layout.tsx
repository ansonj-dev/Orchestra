import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import WebMCPRuntimeProvider from "@/components/WebMCPRuntimeProvider";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: {
    default: "Orchestra — Agent Utility Marketplace",
    template: "%s | Orchestra",
  },
  description: "A bold, open marketplace and runtime for autonomous agents. Discover, connect, and coordinate agent tools.",
  applicationName: "Orchestra",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orchestra",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/orchestra.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/orchestra.svg", type: "image/svg+xml" }],
  },
  keywords: ["AI Agents", "Agent Marketplace", "NEAR Protocol", "WebMCP", "Agent Runtime"],
};

export const viewport: Viewport = {
  themeColor: "#f4f0e6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <PWARegister />
        <WebMCPRuntimeProvider />
        <Navbar />
        <div className="flex-1">{children}</div>
        <footer className="orchestra-footer">
          <div className="orchestra-footer-inner">
            <div className="flex flex-wrap items-center gap-3">
              <span className="footer-mark">O</span>
              <strong>ORCHESTRA / RUNTIME 1.0</strong>
              <span>OPEN AGENT INFRASTRUCTURE</span>
            </div>
            <div className="footer-links">
              <span>SECURITY SANDBOX</span>
              <span>AGENT PROTOCOL</span>
              <span>MIT LICENSE</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
