import Link from "next/link";
import Image from "next/image";
import { featuredProducts } from "@/lib/mock-store";

export default function ProductGrid() {
  return (
    <section className="site-section" aria-labelledby="latest-arrivals-heading">
      <div className="site-container">
        <div className="section-heading flex-col items-start sm:flex-row sm:items-end">
          <h2 id="latest-arrivals-heading" className="neo-heading">
            Latest Arrivals
          </h2>
          <Link
            href="/shop"
            className="section-heading__link"
          >
            View All Products
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <article key={product.id} className="product-card h-full">
              <Link href={`/shop/${product.slug}`} className="group block h-full">
                <div className="product-card__media relative aspect-[3/4] w-full">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    unoptimized
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="product-card-image h-full w-full object-cover object-center"
                  />
                  <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                    {product.isNew && (
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
                    {product.isSoldOut && (
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
                  </div>
                </div>
                <div className="product-card__info flex flex-col items-center text-center">
                  <p className="neo-soft mb-1 text-[10px] font-bold uppercase tracking-widest">
                    {product.category}
                  </p>
                  <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--neo-text)" }}>
                    {product.title}
                  </h3>
                  <p className="font-display font-bold" style={{ color: "var(--neo-accent-strong)" }}>
                    ₱{product.basePrice}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
