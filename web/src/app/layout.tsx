import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import WebMCPRuntimeProvider from "@/components/WebMCPRuntimeProvider";

export const metadata: Metadata = {
  title: "Orchestra | Client-Side Agent Utility Marketplace & Credit Runtime",
  description: "Deterministic, credit-metered marketplace built for Google Chrome and OpenAI agents. Inject verified agentic tools directly into browser sessions without cloud credential leaks.",
  keywords: ["AI Agents", "Agent Marketplace", "Model Context Protocol", "Credit Metering", "Cursor MCP", "Claude Code", "WebMCP"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-white">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <WebMCPRuntimeProvider />
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        
        {/* Global Enterprise Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-6 text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span className="text-slate-400 font-bold">Orchestra Runtime v1.0.0</span>
              <span>— Open Standard Built for Google Chrome & OpenAI Devpost Challenge</span>
            </div>
            <div className="flex items-center space-x-6 text-slate-400">
              <span className="hover:text-cyan-400 cursor-pointer">Security Sandbox</span>
              <span className="hover:text-cyan-400 cursor-pointer">Agent Protocol Spec</span>
              <span className="hover:text-cyan-400 cursor-pointer">MIT Open-Source License</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
