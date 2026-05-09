import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-content mx-auto px-6 py-24 text-center">
      <h1 className="text-5xl md:text-6xl font-black text-sl-red">404</h1>
      <p className="mt-3 text-lg text-sl-ink">This job or page is no longer available.</p>
      <p className="mt-1 text-sm text-sl-warm">It may have been filled or removed.</p>
      <Link href="/" className="inline-block mt-6 bg-sl-red text-white font-bold px-6 py-3 hover:bg-sl-red-deep transition-colors">
        See all open positions →
      </Link>
    </div>
  );
}
