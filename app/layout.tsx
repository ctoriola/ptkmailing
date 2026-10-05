import type { Metadata } from "next";
import { Inter_Tight, Onest } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const onest = Onest({ subsets: ["latin"], variable: "--font-onest" });

export const metadata: Metadata = {
  title: "PrimeTEK SSC Mailing",
  description: "PrimeTEK SSC customer mailing dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${interTight.variable} ${onest.variable}`}>
      <body className="flex min-h-screen flex-col bg-ink font-sans text-fg antialiased">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} PrimeTEK Safety &amp; Security Consultants ·{" "}
          <a href="https://primetekssc.ng" className="hover:text-brand-2">primetekssc.ng</a>
        </footer>
      </body>
    </html>
  );
}
