import CatalogSkeleton from "@/components/storefront/catalog/CatalogSkeleton";

export default function ShopLoading() {
  return (
    <main className="site-shell" aria-busy="true">
      <div className="site-container pb-16 pt-32 sm:pt-36">
        <CatalogSkeleton />
      </div>
    </main>
  );
}
