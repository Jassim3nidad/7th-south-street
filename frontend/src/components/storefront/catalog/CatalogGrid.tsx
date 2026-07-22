import { CatalogProduct } from "@/lib/catalog-queries";
import ProductCard from "./ProductCard";

export default function CatalogGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div
      className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Products"
    >
      {products.map((product) => (
        <div key={product.id} className="h-full" role="listitem">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
