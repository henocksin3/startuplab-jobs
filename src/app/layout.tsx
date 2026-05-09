import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startuplab Jobs",
  description: "Open positions at Startuplab portfolio companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-sl-haze/60">
          <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/brand/sl-symbol-red.svg" alt="" className="h-7 w-7" />
              <span className="font-bold text-lg tracking-tight">Startuplab Jobs</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:text-sl-red">Jobs</Link>
              <Link href="/companies" className="hover:text-sl-red">Companies</Link>
              <a href="https://startuplab.no" className="hover:text-sl-red" target="_blank" rel="noreferrer">Startuplab.no</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-sl-haze/60 mt-16">
          <div className="max-w-content mx-auto px-6 py-8 text-sm text-sl-warm flex flex-wrap items-center justify-between gap-4">
            <div>© Startuplab. Aggregated from portfolio companies' career pages.</div>
            <a href="https://startuplab.no" className="hover:text-sl-red">startuplab.no</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
