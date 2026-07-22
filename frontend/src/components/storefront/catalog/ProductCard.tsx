import Link from "next/link";
import Image from "next/image";
import { CatalogProduct } from "@/lib/catalog-queries";

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const isAvailable = product.availability === "available";
  const isSoldOut = product.availability === "sold_out";

  return (
    <article className="product-card h-full">
      <Link href={`/shop/${product.slug}`} className="group block h-full w-full">
        <div className="product-card__media relative aspect-[3/4] w-full">
          {product.primary_image_url ? (
            <Image
              src={product.primary_image_url}
              alt={product.title}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
              className="product-card-image h-full w-full object-cover object-center"
            />
          ) : (
            <div className="product-card__placeholder flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-widest neo-soft">
              No Image
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.is_new && (
              <span
                className="product-card__badge border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: "var(--neo-badge-surface)",
                  borderColor: "var(--neo-border)",
                  color: "var(--neo-accent-strong)",
                }}
              >
                New
              </span>
            )}
            {isSoldOut && (
              <span
                className="product-card__badge border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: "var(--neo-error-soft)",
                  borderColor: "color-mix(in srgb, var(--neo-error) 30%, transparent)",
                  color: "var(--neo-error)",
                }}
              >
                Sold Out
              </span>
            )}
            {!isAvailable && !isSoldOut && (
              <span
                className="product-card__badge border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: "var(--neo-accent-gradient)",
                  borderColor: "var(--neo-border-strong)",
                  color: "var(--neo-on-accent)",
                }}
              >
                Coming Soon
              </span>
            )}
          </div>
        </div>
        <div className="product-card__info flex flex-col">
          {product.category_name && (
            <p className="neo-soft mb-1 text-[10px] font-bold uppercase tracking-widest">
              {product.category_name}
            </p>
          )}
          <h3 className="mb-2 line-clamp-1 text-sm font-bold" style={{ color: "var(--neo-text)" }}>
            {product.title}
          </h3>
          <p className="font-display text-sm font-bold" style={{ color: "var(--neo-accent-strong)" }}>
            ₱{product.base_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </Link>
    </article>
  );
}
