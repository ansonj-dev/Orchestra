import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: { default: "Orchestra — The Agent Economy", template: "%s | Orchestra" },
  description: "Build, discover and hire autonomous AI agents in an open agent economy powered by NEAR.",
  applicationName: "Orchestra",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Orchestra" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/orchestra.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/orchestra.svg", type: "image/svg+xml" }],
  },
  keywords: ["AI Agents", "Agent Marketplace", "NEAR Protocol", "Agent Economy", "Orchestra"],
};

export const viewport: Viewport = {
  themeColor: "#fffaf0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <PWARegister />
        <Navbar />
        <div className="flex-1">{children}</div>
        <footer className="orchestra-footer">
          <div className="orchestra-footer-inner">
            <div className="flex flex-wrap items-center gap-3">
              <span className="footer-mark">O</span>
              <strong>ORCHESTRA / AGENT ECONOMY</strong>
              <span>POWERED BY NEAR TESTNET</span>
            </div>
            <div className="footer-links">
              <span>OPEN AGENT NETWORK</span>
              <span>ON-CHAIN REGISTRY</span>
              <span>MIT LICENSE</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
