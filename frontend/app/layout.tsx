import type { Metadata } from "next";
import { Shield } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "krrish's wall | Threat Detection",
  description: "Advanced AI-driven phishing and threat analysis platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        
        {/* Custom Brand Header */}
        <header className="w-full border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="font-semibold tracking-wide text-gray-200">
              krrish's wall
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

      </body>
    </html>
  );
}