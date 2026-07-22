"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Shop Error]", error);
  }, [error]);

  return (
    <main className="site-shell">
      <div className="site-container flex min-h-[calc(100dvh-5rem)] items-center justify-center px-0 py-28 text-center">
        <section
          className="neo-state flex w-full max-w-xl flex-col items-center px-6 py-16 sm:px-10"
          role="alert"
          aria-labelledby="catalog-error-heading"
        >
          <div
            className="neo-inset mb-6 grid h-20 w-20 place-items-center rounded-full"
            style={{ color: "var(--neo-error)" }}
          >
            <AlertCircle className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 id="catalog-error-heading" className="neo-heading mb-3 text-3xl sm:text-4xl">
            Catalog Error
          </h1>
          <p className="neo-muted mb-8 max-w-md">
            We encountered a problem loading the collection. Please try again.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <button onClick={() => reset()} className="btn-primary">
              Try Again
            </button>
            <Link href="/" className="btn-outline">
              Return Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
