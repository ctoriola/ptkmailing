import type { Metadata } from "next";
import { Inter_Tight, Onest } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const onest = Onest({ subsets: ["latin"], variable: "--font-onest" });

export const metadata: Metadata = {
  title: { default: "PrimeTEK SSC Mailing", template: "%s · PrimeTEK SSC Mailing" },
  description: "PrimeTEK SSC customer mailing dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${interTight.variable} ${onest.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ToastProvider>
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="border-t border-line/70">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-subtle sm:px-6">
              <span>© {new Date().getFullYear()} PrimeTEK Safety &amp; Security Consultants</span>
              <a href="https://primetekssc.ng" className="transition hover:text-brand-2">primetekssc.ng</a>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
