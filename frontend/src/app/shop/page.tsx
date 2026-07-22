import CatalogGrid from "@/components/storefront/catalog/CatalogGrid";
import CatalogSidebar from "@/components/storefront/catalog/CatalogSidebar";
import CatalogSort from "@/components/storefront/catalog/CatalogSort";
import CatalogEmptyState from "@/components/storefront/catalog/CatalogEmptyState";
import { getStorefrontProducts, getStorefrontCategories, ProductAvailability } from "@/lib/catalog-queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Shop | 7TH SOUTH STREET",
  description: "Browse the latest premium streetwear collections from 7TH SOUTH STREET.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage(props: {
  searchParams?: Promise<{
    category?: string;
    availability?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const category = searchParams?.category;
  const availability = searchParams?.availability as ProductAvailability;
  const sort = searchParams?.sort as "newest" | "price_asc" | "price_desc";
  const query = searchParams?.q;
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;

  const supabase = await createClient();

  // Fetch categories for sidebar
  const { data: categories } = await getStorefrontCategories(supabase);

  // Fetch products
  const { data: products, error } = await getStorefrontProducts(supabase, {
    category,
    availability,
    sort,
    query,
    page,
  });

  if (error) {
    throw new Error("Failed to load catalog data");
  }

  return (
    <main className="site-shell">
      <header className="page-header site-container neo-surface-sm" aria-labelledby="catalog-heading">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 id="catalog-heading" className="neo-heading">
              The Archive
            </h1>
            <p className="neo-kicker mt-3">
              Premium Streetwear Catalog
            </p>
          </div>
          <CatalogSort />
        </div>
      </header>

      <div className="site-container page-content">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <CatalogSidebar 
            categories={categories || []} 
            currentCategory={category} 
            currentAvailability={availability} 
          />
          
          <section className="min-w-0 flex-1" aria-label="Product catalog">
            {(!products || products.length === 0) ? (
              <CatalogEmptyState />
            ) : (
              <CatalogGrid products={products} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
