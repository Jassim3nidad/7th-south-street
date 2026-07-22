export default function CatalogSkeleton() {
  return (
    <div className="w-full" role="status" aria-live="polite">
      <span className="sr-only">Loading catalog</span>
      <div aria-hidden="true">
        {/* Header Skeleton */}
        <div className="neo-surface-sm mb-10 flex flex-col justify-between gap-6 p-7 md:flex-row md:items-end sm:p-9">
          <div className="flex flex-col gap-4">
            <div className="skeleton h-12 w-52 max-w-full" />
            <div className="skeleton h-4 w-64 max-w-full" />
          </div>
          <div className="skeleton h-11 w-full sm:w-64" />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/* Sidebar Skeleton */}
          <aside className="neo-panel flex w-full shrink-0 flex-col gap-8 lg:w-64">
            <div className="flex flex-col gap-4">
              <div className="skeleton mb-1 h-3 w-24" />
              <div className="skeleton h-11 w-full" />
              <div className="skeleton h-11 w-full" />
              <div className="skeleton h-11 w-full" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="skeleton mb-1 h-3 w-24" />
              <div className="skeleton h-11 w-full" />
              <div className="skeleton h-11 w-full" />
            </div>
          </aside>

          {/* Grid Skeleton */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="product-card flex w-full flex-col">
                  <div className="product-card__media relative aspect-[3/4] w-full">
                    <div className="skeleton absolute inset-0" />
                  </div>
                  <div className="product-card__info flex flex-col gap-2">
                    <div className="skeleton h-3 w-16" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
