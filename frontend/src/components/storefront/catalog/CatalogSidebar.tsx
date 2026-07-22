import Link from "next/link";
import { CatalogCategory, ProductAvailability } from "@/lib/catalog-queries";

interface CatalogSidebarProps {
  categories: CatalogCategory[];
  currentCategory?: string;
  currentAvailability?: ProductAvailability;
}

export default function CatalogSidebar({ categories, currentCategory, currentAvailability }: CatalogSidebarProps) {
  const filterClass = (active: boolean) =>
    `filter-chip inline-flex w-full items-center justify-start ${active ? "is-active" : ""}`;

  const getCategoryUrl = (slug: string) => {
    const params = new URLSearchParams();
    if (slug !== "all") params.set("category", slug);
    if (currentAvailability) params.set("availability", currentAvailability);
    return `/shop?${params.toString()}`;
  };

  const getAvailabilityUrl = (status: ProductAvailability | "all") => {
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    if (status !== "all") params.set("availability", status);
    return `/shop?${params.toString()}`;
  };

  return (
    <aside className="neo-panel flex w-full shrink-0 flex-col gap-8 lg:sticky lg:top-28 lg:w-64" aria-label="Catalog filters">
      <nav className="flex flex-col gap-4" aria-labelledby="category-filter-heading">
        <h2 id="category-filter-heading" className="neo-kicker">Categories</h2>
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href={getCategoryUrl("all")}
              className={filterClass(!currentCategory)}
              aria-current={!currentCategory ? "page" : undefined}
            >
              All Products
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={getCategoryUrl(cat.slug)}
                className={filterClass(currentCategory === cat.slug)}
                aria-current={currentCategory === cat.slug ? "page" : undefined}
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="flex flex-col gap-4" aria-labelledby="availability-filter-heading">
        <h2 id="availability-filter-heading" className="neo-kicker">Availability</h2>
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href={getAvailabilityUrl("all")}
              className={filterClass(!currentAvailability)}
              aria-current={!currentAvailability ? "page" : undefined}
            >
              Any Status
            </Link>
          </li>
          <li>
            <Link
              href={getAvailabilityUrl("available")}
              className={filterClass(currentAvailability === "available")}
              aria-current={currentAvailability === "available" ? "page" : undefined}
            >
              Available
            </Link>
          </li>
          <li>
            <Link
              href={getAvailabilityUrl("coming_soon")}
              className={filterClass(currentAvailability === "coming_soon")}
              aria-current={currentAvailability === "coming_soon" ? "page" : undefined}
            >
              Coming Soon
            </Link>
          </li>
          <li>
            <Link
              href={getAvailabilityUrl("sold_out")}
              className={filterClass(currentAvailability === "sold_out")}
              aria-current={currentAvailability === "sold_out" ? "page" : undefined}
            >
              Sold Out
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
