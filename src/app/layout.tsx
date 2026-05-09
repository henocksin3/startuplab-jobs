import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Startuplab Jobs", template: "%s — Startuplab Jobs" },
  description: "Open positions at Startuplab portfolio companies. Aggregated from career pages across the Norwegian tech startup ecosystem.",
  icons: { icon: "/brand/sl-symbol-red.svg" },
  openGraph: {
    title: "Startuplab Jobs",
    description: "Work for Norway's most exciting tech startups.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-sl-haze/60">
          <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/brand/sl-symbol-red.svg" alt="" className="h-6 w-6" />
              <span className="font-bold text-base tracking-tight">Startuplab Jobs</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/" className="hover:text-sl-red">Jobs</Link>
              <Link href="/companies" className="hover:text-sl-red">Companies</Link>
              <a href="https://startuplab.no" className="hover:text-sl-red" target="_blank" rel="noreferrer">startuplab.no ↗</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-sl-haze/60 mt-12">
          <div className="max-w-content mx-auto px-6 py-6 text-xs text-sl-warm flex flex-wrap items-center justify-between gap-4">
            <div>© Startuplab. Aggregated from portfolio companies' career pages.</div>
            <a href="https://startuplab.no" className="hover:text-sl-red">startuplab.no</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
