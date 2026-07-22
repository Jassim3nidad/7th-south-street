"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CatalogSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-64">
      <label htmlFor="sort" className="neo-kicker">
        Sort By
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="input-dark min-h-11 cursor-pointer pr-10 text-sm font-bold uppercase tracking-wider"
      >
        <option value="newest">Newest Arrivals</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
}
