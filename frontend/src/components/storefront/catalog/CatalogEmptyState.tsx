import Link from "next/link";
import { SearchX } from "lucide-react";

export default function CatalogEmptyState() {
  return (
    <div
      className="neo-state flex min-h-[400px] h-full w-full flex-col items-center justify-center px-5 py-20 text-center"
      role="status"
    >
      <div className="neo-inset mb-6 grid h-20 w-20 place-items-center rounded-full neo-soft">
        <SearchX className="h-10 w-10" aria-hidden="true" />
      </div>
      <h3 className="neo-heading mb-3 text-3xl">
        No Results Found
      </h3>
      <p className="neo-muted mb-8 max-w-md leading-relaxed">
        We couldn't find any products matching your current filters. Try adjusting your search or category selection.
      </p>
      <Link href="/shop" className="btn-primary">
        Clear All Filters
      </Link>
    </div>
  );
}
